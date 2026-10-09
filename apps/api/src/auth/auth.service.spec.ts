import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    $transaction: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
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

    it('should throw UnauthorizedException on invalid password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
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
