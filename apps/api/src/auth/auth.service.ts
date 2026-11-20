import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, UserWithoutPassword } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserStatus } from '@packages/shared';
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
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto): Promise<UserWithoutPassword> {
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
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      // Use generic failure message to prevent email enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Your account is suspended or pending verification');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
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
        data: { passwordHash },
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
