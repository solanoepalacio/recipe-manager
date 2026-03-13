import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { ProfileResponse } from '@recipe-manager/shared';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfileResponse(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const { password, ...rest } = dto;
    // Build the update data without the raw password field
    const data: Record<string, unknown> = { ...rest };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toProfileResponse(user);
  }

  private toProfileResponse(user: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
    householdId: string;
  }): ProfileResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      gender: user.gender as ProfileResponse['gender'],
      dateOfBirth: user.dateOfBirth instanceof Date
        ? user.dateOfBirth.toISOString().split('T')[0]
        : null,
      householdId: user.householdId,
    };
  }
}
