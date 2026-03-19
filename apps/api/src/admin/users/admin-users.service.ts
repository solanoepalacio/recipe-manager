// apps/api/src/admin/users/admin-users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUserResponse, PaginatedResponse } from '@recipe-manager/shared';
import { CreateAdminUserDto } from './dto/create-user.dto';
import { UpdateAdminUserDto } from './dto/update-user.dto';

function toAdminUserResponse(user: {
  id: string; householdId: string; name: string; email: string | null;
  gender: string; dateOfBirth: Date;
  createdAt: Date; updatedAt: Date;
}): AdminUserResponse {
  return {
    id: user.id,
    householdId: user.householdId,
    name: user.name,
    email: user.email,
    username: null,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

const USER_SELECT = {
  id: true, householdId: true, name: true, email: true,
  gender: true, dateOfBirth: true, createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 20): Promise<PaginatedResponse<AdminUserResponse>> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: USER_SELECT,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { items: users.map(toAdminUserResponse), total, page, perPage };
  }

  async findOne(id: string): Promise<AdminUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return toAdminUserResponse(user);
  }

  async create(dto: CreateAdminUserDto): Promise<AdminUserResponse> {
    const household = await this.prisma.household.findUnique({ where: { id: dto.householdId } });
    if (!household) throw new NotFoundException(`Household ${dto.householdId} not found`);
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    const user = await this.prisma.user.create({
      data: {
        householdId: dto.householdId,
        name: dto.name,
        email: dto.email ?? null,
        passwordHash,
        gender: dto.gender as $Enums.Gender,
        dateOfBirth: new Date(dto.dateOfBirth),
      },
      select: USER_SELECT,
    });
    return toAdminUserResponse(user);
  }

  async update(id: string, dto: UpdateAdminUserDto): Promise<AdminUserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`User ${id} not found`);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.householdId !== undefined) data.householdId = dto.householdId;
    if (dto.password !== undefined) data.passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.update({ where: { id }, data, select: USER_SELECT });
    return toAdminUserResponse(user);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`User ${id} not found`);
    await this.prisma.user.delete({ where: { id } });
  }

  async generatePasswordResetUrl(userId: string): Promise<{ resetUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: tokenHash,
        resetTokenExpiry: expiresAt,
      },
    });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
    return { resetUrl };
  }
}
