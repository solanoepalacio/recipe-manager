import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileResponse } from '@recipe-manager/shared';
import { UpdateProfileDto } from './dto/update-profile.dto';

function toProfileResponse(user: {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
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
    // Normal users always have gender/dob set; cast safely
    gender: (user.gender ?? '') as ProfileResponse['gender'],
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : '',
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
    const { password, currentPassword, dateOfBirth, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (dateOfBirth !== undefined) data.dateOfBirth = new Date(dateOfBirth);

    if (password) {
      if (!currentPassword) {
        throw new BadRequestException('currentPassword is required to change password');
      }
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      if (!user.passwordHash) {
        throw new BadRequestException('No password is set for this account');
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { id: { not: userId }, email: dto.email },
      });
      if (conflict) throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return toProfileResponse(updated);
  }
}
