import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { HouseholdResponse, MemberResponse } from '@recipe-manager/shared';

@Injectable()
export class HouseholdService {
  constructor(private prisma: PrismaService) {}

  async getHousehold(householdId: string): Promise<HouseholdResponse> {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: { users: true },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    return {
      id: household.id,
      name: household.name,
      members: household.users.map((u) => this.toMemberResponse(u)),
    };
  }

  toMemberResponse(user: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    passwordHash: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
  }): MemberResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      gender: user.gender as MemberResponse['gender'],
      dateOfBirth: user.dateOfBirth instanceof Date
        ? user.dateOfBirth.toISOString().split('T')[0]
        : null,
      canLogin: !!user.passwordHash,
    };
  }
}
