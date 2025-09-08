import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Role } from '../../../../generated/prisma';

type UserResponse = {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  role: Role;
  isActive: boolean;
  domainId: string | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: UserResponse;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { email, fullName, username, password, domainId } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Check if domain exists if provided
    if (domainId) {
      const domain = await this.prisma.domain.findUnique({
        where: { id: domainId },
      });
      if (!domain) {
        throw new NotFoundException('Domain not found');
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if this is the first user (should be ADMIN)
    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.EMPLOYEE;

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        username,
        password: hashedPassword,
        role,
        domainId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const userWithUpdatedAt = { ...user, updatedAt: new Date() };
    const tokens = await this.generateTokens(userWithUpdatedAt);

    return { user: userWithUpdatedAt, tokens };
  }

  async login(loginDto: LoginDto): Promise<{
    user: UserResponse;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { emailOrUsername, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Remove password from response and add updatedAt
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = {
      ...user,
      updatedAt: new Date(),
    };

    // Generate tokens
    const tokens = await this.generateTokens(userWithoutPassword);

    return { user: userWithoutPassword, tokens };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email, isActive: true },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send email with reset token
    // In a real application, you would send an email here
    console.log(`Reset token for ${email}: ${resetToken}`);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  async validateUser(payload: JwtPayload): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return user ? { ...user, updatedAt: new Date() } : null;
  }

  private async generateTokens(
    user: UserResponse,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }
}
