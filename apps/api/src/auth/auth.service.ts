import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, UserWithoutPassword } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserStatus } from '@packages/shared';
import { BotProtectionService } from './services/bot-protection.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly botProtectionService: BotProtectionService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto, ipAddress?: string): Promise<UserWithoutPassword> {
    // 1. Bot & Human Verification check
    const botCheck = await this.botProtectionService.verifyToken(dto.botVerificationToken, ipAddress);
    if (!botCheck.valid) {
      throw new BadRequestException(botCheck.reason || 'Human verification failed. Please check "I am a human".');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: UserRole.BUSINESS_OWNER,
          status: UserStatus.ACTIVE,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          themePreference: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'AUTH_REGISTER',
          entityType: 'User',
          entityId: user.id,
          metadata: {
            email: user.email,
            role: user.role,
          },
        },
      });

      return user;
    });

    this.logger.log(`New user registered successfully: [${newUser.id}] ${newUser.email}`);
    return newUser as unknown as UserWithoutPassword;
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: UserWithoutPassword;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // 1. Bot & Human Verification Check
    const botCheck = await this.botProtectionService.verifyToken(dto.botVerificationToken, ipAddress);
    if (!botCheck.valid) {
      throw new BadRequestException(botCheck.reason || 'Human verification failed. Please check "I am a human".');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      // Use generic failure message to prevent email enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Progressive Lockout Check: Has the user been locked out?
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      this.logger.warn(
        `Login blocked for locked user [${user.id}] ${user.email}. Remaining lockout: ${remainingSeconds}s (${remainingMinutes}m)`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
          error: 'Too Many Requests',
          isLocked: true,
          lockedUntil: user.lockedUntil.toISOString(),
          remainingSeconds,
          consecutiveFailures: user.failedLoginAttempts,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Your account is suspended or pending verification');
    }

    // 3. Password Verification & Progressive Penalty Tracking
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const newFailures = (user.failedLoginAttempts || 0) + 1;
      let newLockedUntil: Date | null = null;
      let lockDurationMinutes = 0;

      // Rule: 4 wrong attempts = 3-minute break; 5+ wrong attempts = 5-minute break
      if (newFailures === 4) {
        lockDurationMinutes = 3;
        newLockedUntil = new Date(Date.now() + 3 * 60 * 1000);
      } else if (newFailures >= 5) {
        lockDurationMinutes = 5;
        newLockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailures,
          lockedUntil: newLockedUntil,
          lastFailedLoginAt: new Date(),
        },
      });

      if (newLockedUntil) {
        const remainingSeconds = lockDurationMinutes * 60;
        this.logger.warn(
          `User [${user.id}] ${user.email} triggered temporary ${lockDurationMinutes}-minute lockout on attempt ${newFailures}`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Account temporarily locked for ${lockDurationMinutes} minutes due to multiple failed login attempts. Please try again after the cooldown.`,
            error: 'Too Many Requests',
            isLocked: true,
            lockedUntil: newLockedUntil.toISOString(),
            remainingSeconds,
            consecutiveFailures: newFailures,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Attempts 1 to 3: Provide helpful warning with remaining attempts
      const remainingAttempts = 4 - newFailures;
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: `Invalid email or password. Attempt ${newFailures} of 4. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining before temporary 3-minute lockout.`,
        remainingAttempts,
        failedAttempts: newFailures,
      });
    }

    // 4. Successful Password Match: Reset failure counter & clear lockout if any
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Generate refresh token and its hash
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const refreshDays = this.configService.get<number>('jwt.refreshExpirationDays') || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
      },
    });

    // Generate access token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      sessionId: session.id,
    };

    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const accessExpiration = this.configService.get<string>('jwt.accessExpiration') || '15m';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiration,
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'AUTH_LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: ipAddress || null,
        metadata: {
          sessionId: session.id,
          userAgent,
        },
      },
    });

    const safeUser: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      themePreference: user.themePreference,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: safeUser,
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  async refresh(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserWithoutPassword;
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Reuse detection: if a revoked session is being presented again, revoke ALL sessions
    if (session.revokedAt) {
      this.logger.warn(`Suspicious refresh token reuse detected for user ${session.userId}. Revoking all sessions.`);
      await this.prisma.refreshSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Security alert: Token reuse detected. Please log in again.');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is suspended or pending verification');
    }

    // Token rotation: revoke previous session and issue new token pair
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);

    const refreshDays = this.configService.get<number>('jwt.refreshExpirationDays') || 7;
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + refreshDays);

    const [newSession] = await this.prisma.$transaction([
      this.prisma.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: newTokenHash,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          expiresAt: newExpiresAt,
        },
      }),
      this.prisma.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
    ]);

    const payload = {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      status: session.user.status,
      sessionId: newSession.id,
    };

    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const accessExpiration = this.configService.get<string>('jwt.accessExpiration') || '15m';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiration,
    });

    const safeUser: UserWithoutPassword = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      status: session.user.status,
      themePreference: session.user.themePreference,
      emailVerifiedAt: session.user.emailVerifiedAt,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
    };

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 15 * 60,
      user: safeUser,
    };
  }

  async logout(userId: string, rawRefreshToken?: string): Promise<{ success: boolean; message: string }> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke latest active session for this user
      const latestSession = await this.prisma.refreshSession.findFirst({
        where: { userId, revokedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (latestSession) {
        await this.prisma.refreshSession.update({
          where: { id: latestSession.id },
          data: { revokedAt: new Date() },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'AUTH_LOGOUT',
        entityType: 'User',
        entityId: userId,
      },
    });

    return { success: true, message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ success: boolean; revokedCount: number }> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'AUTH_LOGOUT_ALL',
        entityType: 'User',
        entityId: userId,
        metadata: { revokedCount: result.count },
      },
    });

    return { success: true, revokedCount: result.count };
  }

  async getMe(userId: string): Promise<UserWithoutPassword> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
    devResetUrl?: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);
    const genericMessage =
      'If an account exists with that email address, a password reset link has been issued.';

    if (!user || user.status !== UserStatus.ACTIVE) {
      return { success: true, message: genericMessage };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.$transaction(async (tx) => {
      // Invalidate previous unused password reset tokens for this user
      await tx.authToken.updateMany({
        where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
        data: { usedAt: new Date() },
      });

      await tx.authToken.create({
        data: {
          userId: user.id,
          type: 'PASSWORD_RESET',
          tokenHash,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'AUTH_PASSWORD_RESET_REQUESTED',
          entityType: 'User',
          entityId: user.id,
        },
      });
    });

    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';

    this.logger.log(`Password reset token issued for user [${user.id}] (expires in 30m)`);

    return {
      success: true,
      message: genericMessage,
      ...(!isProduction ? { devResetUrl: resetUrl } : {}),
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const tokenHash = this.hashToken(token.trim());
    const record = await this.prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !record ||
      record.type !== 'PASSWORD_RESET' ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      await tx.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      // Security: revoke all existing refresh sessions after password change
      await tx.refreshSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: record.userId,
          action: 'AUTH_PASSWORD_RESET_COMPLETED',
          entityType: 'User',
          entityId: record.userId,
        },
      });
    });

    return {
      success: true,
      message: 'Your password has been updated. Please sign in with your new password.',
    };
  }

  async requestEmailVerification(userId: string): Promise<{
    success: boolean;
    message: string;
    devVerifyUrl?: string;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.emailVerifiedAt) {
      return { success: true, message: 'Your email address is already verified.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';

    return {
      success: true,
      message: 'Verification link generated.',
      ...(!isProduction ? { devVerifyUrl: verifyUrl } : {}),
    };
  }

  async verifyEmail(token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const tokenHash = this.hashToken(token.trim());
    const record = await this.prisma.authToken.findUnique({
      where: { tokenHash },
    });

    if (
      !record ||
      record.type !== 'EMAIL_VERIFICATION' ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired email verification token');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });

      await tx.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: record.userId,
          action: 'AUTH_EMAIL_VERIFIED',
          entityType: 'User',
          entityId: record.userId,
        },
      });
    });

    return {
      success: true,
      message: 'Your email address has been verified successfully.',
    };
  }
}
