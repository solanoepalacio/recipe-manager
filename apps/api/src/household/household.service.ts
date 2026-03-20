import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HouseholdResponse } from '@recipe-manager/shared';

@Injectable()
export class HouseholdService {
  constructor(private readonly prisma: PrismaService) {}

  async getHousehold(householdId: string): Promise<HouseholdResponse> {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: { users: true },
    });
    if (!household) throw new NotFoundException('Household not found');

    return {
      id: household.id,
      name: household.name,
      createdAt: household.createdAt.toISOString(),
      updatedAt: household.updatedAt.toISOString(),
      members: household.users.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        username: null,
        userType: m.userType as HouseholdResponse['members'][number]['userType'],
        gender: m.gender as HouseholdResponse['members'][number]['gender'],
        dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    };
  }
}
