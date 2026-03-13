import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminUserResponse,
  PaginatedResponse,
  PasswordResetUrlResponse,
} from '@recipe-manager/shared';
import type { AdminCreateUserDto } from './dto/create-user.dto';
import type { AdminUpdateUserDto } from './dto/update-user.dto';

type UserWithHousehold = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  passwordHash: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  householdId: string;
  createdAt: Date;
  updatedAt: Date;
  household: { id: string; name: string };
};

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async listUsers(page: number, perPage: number): Promise<PaginatedResponse<AdminUserResponse>> {
    const skip = (page - 1) * perPage;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: perPage,
        include: { household: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users.map((u) => this.toAdminUserResponse(u as UserWithHousehold)),
      total,
      page,
      perPage,
    };
  }

  async getUser(id: string): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { household: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toAdminUserResponse(user as UserWithHousehold);
  }

  async createUser(dto: AdminCreateUserDto): Promise<AdminUserResponse> {
    const { password, dateOfBirth, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    if (dateOfBirth) {
      data.dateOfBirth = new Date(dateOfBirth);
    }

    const user = await this.prisma.user.create({
      data: data as Parameters<typeof this.prisma.user.create>[0]['data'],
      include: { household: true },
    });
    return this.toAdminUserResponse(user as UserWithHousehold);
  }

  async updateUser(id: string, dto: AdminUpdateUserDto): Promise<AdminUserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const { password, dateOfBirth, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    if (dateOfBirth) {
      data.dateOfBirth = new Date(dateOfBirth);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.user.update>[0]['data'],
      include: { household: true },
    });
    return this.toAdminUserResponse(user as UserWithHousehold);
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.delete({ where: { id } });
  }

  async generatePasswordResetUrl(id: string): Promise<PasswordResetUrlResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    return { resetUrl: `${frontendUrl}/reset-password?token=${rawToken}` };
  }

  private toAdminUserResponse(user: UserWithHousehold): AdminUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      gender: user.gender,
      dateOfBirth:
        user.dateOfBirth instanceof Date
          ? user.dateOfBirth.toISOString().split('T')[0]
          : null,
      householdId: user.householdId,
      householdName: user.household.name,
      canLogin: !!user.passwordHash,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
