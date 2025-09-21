import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Role } from '../../../../generated/prisma';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

type UserResponse = {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  role: Role;
  isActive: boolean;
  domainId: string | null;
  domain?: { id: string; name: string; slug: string } | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: UserResponse;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { email, fullName, username, password, domainId, adminKey } =
      registerDto;
    this.logger.log(`Register attempt: email=${email}, username=${username}`);

    // Check if user already exists

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
    });

    if (existingUser) {
      this.logger.warn(
        `Register failed: email or username already exists (email=${email}, username=${username})`,
      );
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Check if domain exists if provided and enforce rules
    let selectedDomain: { id: string; slug: string } | null = null;
    if (domainId) {
      const domain = await this.prisma.domain.findUnique({
        where: { id: domainId },
        select: { id: true, slug: true },
      });
      if (!domain) {
        throw new NotFoundException('Domain not found');
      }
      selectedDomain = domain;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Determine user role based on adminKey
    let role: Role = Role.EMPLOYEE;
    // If domain is 'direction', require adminKey
    if (selectedDomain?.slug === 'direction' && !adminKey) {
      this.logger.warn(
        `Register failed: admin key required for Direction domain`,
      );
      throw new UnauthorizedException(
        'Admin key required for Direction domain',
      );
    }
    if (adminKey) {
      const adminRegistrationKey = this.configService.get<string>(
        'ADMIN_REGISTRATION_KEY',
      );
      if (adminKey === adminRegistrationKey) {
        role = Role.ADMIN;
      } else {
        this.logger.warn(`Register failed: invalid admin key provided`);
        throw new UnauthorizedException('Invalid admin key');
      }
    }

    // Create user

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        username: username ?? null,
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
        domain: { select: { id: true, name: true, slug: true } },
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Hash and store refreshToken
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    this.logger.log(`Register success: userId=${user.id}, email=${user.email}`);
    return { user, tokens };
  }

  async login(loginDto: LoginDto): Promise<{
    user: UserResponse;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { emailOrUsername, password } = loginDto;
    this.logger.log(`Login attempt: identifier=${emailOrUsername}`);

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
        domain: { select: { id: true, name: true, slug: true } },
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    if (!user) {
      this.logger.warn(
        `Login failed: user not found (identifier=${emailOrUsername})`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `Login failed: invalid password (userId=${user.id}, identifier=${emailOrUsername})`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    this.logger.log(`Login success: userId=${user.id}, email=${user.email}`);

    // Remove password from response and add updatedAt
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = await this.generateTokens(userWithoutPassword);

    // Hash and store refreshToken
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return { user: userWithoutPassword, tokens };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    this.logger.log(`Forgot password attempt: email=${email}`);
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
    });

    if (!user) {
      // Don't reveal if user exists or not
      this.logger.warn(`Forgot password: no user found for email=${email}`);
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
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry,
      },
    });

    // Send email with reset token
    await this.mailService.sendResetPasswordEmail(email, resetToken);
    this.logger.verbose(`Reset token for ${email}: ${resetToken}`);

    this.logger.log(
      `Forgot password: reset token generated for userId=${user.id}, email=${email}`,
    );
    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    this.logger.log(`Reset password attempt: token=${token}`);
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
      this.logger.warn(
        `Reset password failed: invalid or expired token=${token}`,
      );
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password, clear reset token, et révoque refreshToken
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null, // révoque tous les refresh tokens
      },
    });
    this.logger.log(
      `Reset password success: userId=${user.id}, email=${user.email}`,
    );

    return { message: 'Password has been reset successfully' };
  }

  async validateUser(payload: JwtPayload): Promise<UserResponse | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        domainId: true,
        domain: { select: { id: true, name: true, slug: true } },
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
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
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log(`Refresh token attempt: userId=${userId}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user?.refreshToken) {
      this.logger.warn(
        `Refresh token failed: user not found or no refreshToken (userId=${userId})`,
      );
      throw new UnauthorizedException('Access Denied');
    }
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      this.logger.warn(
        `Refresh token failed: invalid token (userId=${userId})`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Génère de nouveaux tokens
    const tokens = await this.generateTokens(user);
    // Stocke le nouveau refreshToken hashé
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });
    this.logger.log(`Refresh token success: userId=${userId}`);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    this.logger.log(`Logout: userId=${userId}`);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
