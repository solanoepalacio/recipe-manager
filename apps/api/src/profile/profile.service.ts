import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileResponse } from '@recipe-manager/shared';
import { UpdateProfileDto } from './dto/update-profile.dto';

function toProfileResponse(user: {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  username: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProfileResponse {
  return {
    id: user.id,
    householdId: user.householdId,
    name: user.name,
    email: user.email,
    username: user.username,
    gender: user.gender as ProfileResponse['gender'],
    dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toProfileResponse(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const { password, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    // Check uniqueness conflicts before updating
    if (dto.email || dto.username) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            dto.email ? { email: dto.email } : {},
            dto.username ? { username: dto.username } : {},
          ].filter((c) => Object.keys(c).length > 0),
        },
      });
      if (conflict) throw new ConflictException('Email or username already in use');
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return toProfileResponse(updated);
  }
}
