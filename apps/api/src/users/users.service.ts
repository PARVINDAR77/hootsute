import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role, UserStatus } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'passwordHash'>;

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  themePreference: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<UserWithoutPassword | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
    status?: UserStatus;
  }): Promise<UserWithoutPassword> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash: data.passwordHash,
        role: data.role || Role.BUSINESS_OWNER,
        status: data.status || UserStatus.ACTIVE,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserWithoutPassword> {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: SAFE_USER_SELECT,
    });
  }

  async updatePreferences(
    id: string,
    prefs: { themePreference?: 'light' | 'dark' },
  ): Promise<UserWithoutPassword> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(prefs.themePreference ? { themePreference: prefs.themePreference } : {}),
      },
      select: SAFE_USER_SELECT,
    });
  }
}
