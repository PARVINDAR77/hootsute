import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { BotProtectionService } from './services/bot-protection.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let botProtectionService: BotProtectionService;

  const mockPrisma = {
    $transaction: jest.fn(),
    user: {
      update: jest.fn().mockResolvedValue({ id: 'user-uuid-1' }),
    },
    refreshSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockBotProtectionService = {
    verifyToken: jest.fn().mockResolvedValue({ valid: true }),
    createChallenge: jest.fn().mockReturnValue({
      challengeId: 'challenge-1',
      nonce: 'nonce-1',
      timestamp: Date.now(),
      signature: 'sig-1',
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.accessSecret') return 'test-secret-at-least-32-chars-long';
      if (key === 'jwt.accessExpiration') return '15m';
      if (key === 'jwt.refreshExpirationDays') return 7;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: BotProtectionService, useValue: mockBotProtectionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    botProtectionService = module.get<BotProtectionService>(BotProtectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user and return safe user object', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-uuid-1',
              email: 'newuser@example.com',
              name: 'New User',
              role: Role.BUSINESS_OWNER,
              status: UserStatus.ACTIVE,
              emailVerifiedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
        });
      });

      const result = await service.register({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('id', 'user-uuid-1');
      expect(result).toHaveProperty('email', 'newuser@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@example.com',
      });

      await expect(
        service.register({
          name: 'Existing',
          email: 'existing@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        name: 'Valid User',
        passwordHash: hashedPassword,
        role: Role.BUSINESS_OWNER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.refreshSession.create.mockResolvedValue({
        id: 'session-uuid-1',
      });

      mockJwtService.signAsync.mockResolvedValue('jwt-mock-token');

      const result = await service.login({
        email: 'user@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('accessToken', 'jwt-mock-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid password with remaining attempts info', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({ failedLoginAttempts: 1 }),
        }),
      );
    });

    it('should trigger a 3-minute lockout on the 4th consecutive failed password attempt (HTTP 429)', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 3, // Already failed 3 times
        lockedUntil: null,
      });

      try {
        await service.login({
          email: 'user@example.com',
          password: 'WrongPasswordAgain!',
        });
        fail('Should have thrown HttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const res = err.getResponse();
        expect(res).toHaveProperty('isLocked', true);
        expect(res).toHaveProperty('remainingSeconds', 180);
        expect(res).toHaveProperty('consecutiveFailures', 4);
      }

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            failedLoginAttempts: 4,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('should trigger a 5-minute lockout on the 5th consecutive failed password attempt (HTTP 429)', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 4, // 4 prior failures, lockout period expired
        lockedUntil: null,
      });

      try {
        await service.login({
          email: 'user@example.com',
          password: 'WrongPasswordAgain!',
        });
        fail('Should have thrown HttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const res = err.getResponse();
        expect(res).toHaveProperty('isLocked', true);
        expect(res).toHaveProperty('remainingSeconds', 300);
        expect(res).toHaveProperty('consecutiveFailures', 5);
      }
    });

    it('should immediately block login with HTTP 429 if account is actively locked', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const lockedUntilFuture = new Date(Date.now() + 120 * 1000); // 2 minutes remaining
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 4,
        lockedUntil: lockedUntilFuture,
      });

      try {
        await service.login({
          email: 'user@example.com',
          password: 'AnyPassword!',
        });
        fail('Should have thrown HttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const res = err.getResponse();
        expect(res).toHaveProperty('isLocked', true);
        expect(res.remainingSeconds).toBeGreaterThan(0);
      }
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should invalidate active session on logout', async () => {
      mockPrisma.refreshSession.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-log-id' });

      const result = await service.logout('user-uuid-1', 'raw-refresh-token');
      expect(result).toEqual({ success: true, message: 'Logged out successfully' });
      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
