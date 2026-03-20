// apps/api/src/admin/users/admin-users.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUserResponse, PaginatedResponse } from '@recipe-manager/shared';
import { CreateAdminUserDto } from './dto/create-user.dto';
import { UpdateAdminUserDto } from './dto/update-user.dto';

function toAdminUserResponse(user: {
  id: string; householdId: string; name: string; email: string | null;
  userType: string; gender: string | null; dateOfBirth: Date | null;
  createdAt: Date; updatedAt: Date;
  household?: { name: string } | null;
}): AdminUserResponse {
  return {
    id: user.id,
    householdId: user.householdId,
    householdName: user.household?.name,
    name: user.name,
    email: user.email,
    username: null,
    userType: user.userType,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

const USER_SELECT = {
  id: true, householdId: true, name: true, email: true,
  userType: true, gender: true, dateOfBirth: true, createdAt: true, updatedAt: true,
  household: { select: { name: true } },
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 20, userType?: string): Promise<PaginatedResponse<AdminUserResponse>> {
    const where = userType ? { userType: userType as $Enums.UserType } : {};
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
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

    const userType = dto.userType ?? 'normal';

    // Validate type-specific required fields
    if (userType === 'normal') {
      if (!dto.email) throw new BadRequestException('El correo es obligatorio para usuarios normales');
      if (!dto.password) throw new BadRequestException('La contraseña es obligatoria para usuarios normales');
      if (!dto.gender) throw new BadRequestException('El genero es obligatorio para usuarios normales');
      if (!dto.dateOfBirth) throw new BadRequestException('La fecha de nacimiento es obligatoria para usuarios normales');
    } else if (userType === 'kid') {
      if (!dto.dateOfBirth) throw new BadRequestException('La fecha de nacimiento es obligatoria para miembros niños');
    }
    // agent: only name required (already validated by DTO @MinLength(1))

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        householdId: dto.householdId,
        name: dto.name,
        email: dto.email ?? null,
        passwordHash,
        userType: userType as $Enums.UserType,
        gender: dto.gender ? (dto.gender as $Enums.Gender) : null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      },
      select: USER_SELECT,
    });

    return toAdminUserResponse(user);
  }

  async update(id: string, dto: UpdateAdminUserDto): Promise<AdminUserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`User ${id} not found`);
    const data: Record<string, unknown> = {};
    if (dto.userType !== undefined) data.userType = dto.userType as $Enums.UserType;
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
