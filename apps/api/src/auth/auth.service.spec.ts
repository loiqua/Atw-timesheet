import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    domain: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
    sendResetPasswordEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
        ADMIN_REGISTRATION_KEY: 'test-admin-key',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    // Reset bcrypt mocks
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'Password123!',
        domainId: 'domain-123',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.domain.findUnique.mockResolvedValue({
        id: 'domain-123',
        slug: 'engineering',
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-123',
        email: registerDto.email,
        fullName: registerDto.fullName,
        password: 'hashedPassword123',
        role: 'EMPLOYEE',
        isActive: true,
        domainId: registerDto.domainId,
      });

      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        fullName: 'Existing User',
        password: 'Password123!',
        domainId: 'domain-123',
      };

      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        emailOrUsername: 'test@example.com',
        password: 'Password123!',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      const mockUser = {
        id: 'user-123',
        email: loginDto.emailOrUsername,
        password: 'hashedPassword123',
        fullName: 'Test User',
        role: 'EMPLOYEE',
        isActive: true,
      };

      mockPrismaService.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValueOnce(mockUser);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(loginDto.emailOrUsername);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto = {
        emailOrUsername: 'test@example.com',
        password: 'WrongPassword123!',
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const loginDto = {
        emailOrUsername: 'test@example.com',
        password: 'Password123!',
      };

      // findFirst with isActive: true will return null for inactive users
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 'user-123', email: 'test@example.com' };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
      mockJwtService.verifyAsync.mockResolvedValueOnce(payload);
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        refreshToken: 'hashedRefreshToken',
        isActive: true,
      });

      mockJwtService.signAsync.mockResolvedValueOnce('new-access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('new-refresh-token');

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshTokens('user-123', refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const forgotPasswordDto = {
        email: 'test@example.com',
      };

      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: forgotPasswordDto.email,
        fullName: 'Test User',
      });

      mockPrismaService.user.update.mockResolvedValueOnce({});
      mockMailService.sendResetPasswordEmail.mockResolvedValueOnce(undefined);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty('message');
      expect(mockMailService.sendResetPasswordEmail).toHaveBeenCalled();
    });

    it('should return success even if user not found (security)', async () => {
      const forgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty('message');
      expect(mockMailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordDto = {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      };

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        resetToken: 'valid-reset-token',
        resetTokenExpiry: futureDate,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
      mockPrismaService.user.update.mockResolvedValueOnce({});

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          password: 'hashedNewPassword',
          refreshToken: null,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    });

    it('should throw error if token expired', async () => {
      const resetPasswordDto = {
        token: 'expired-token',
        newPassword: 'NewPassword123!',
      };

      // Token expiré = findFirst retourne null car la requête Prisma filtre avec gt: new Date()
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw error if token invalid', async () => {
      const resetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      };

      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      mockPrismaService.user.update.mockResolvedValueOnce({});

      await service.logout('user-123');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { refreshToken: null },
      });
    });
  });
});
