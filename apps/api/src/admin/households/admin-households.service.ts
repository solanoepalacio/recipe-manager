import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminHouseholdResponse,
  MemberResponse,
  PaginatedResponse,
} from '@recipe-manager/shared';
import type { AdminCreateHouseholdDto } from './dto/create-household.dto';
import type { AdminUpdateHouseholdDto } from './dto/update-household.dto';

type HouseholdWithUsers = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  users: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    passwordHash: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
  }[];
};

@Injectable()
export class AdminHouseholdsService {
  constructor(private prisma: PrismaService) {}

  async listHouseholds(
    page: number,
    perPage: number,
  ): Promise<PaginatedResponse<AdminHouseholdResponse>> {
    const skip = (page - 1) * perPage;
    const [households, total] = await Promise.all([
      this.prisma.household.findMany({
        skip,
        take: perPage,
        include: { users: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.household.count(),
    ]);

    return {
      items: households.map((h) => this.toAdminHouseholdResponse(h as HouseholdWithUsers)),
      total,
      page,
      perPage,
    };
  }

  async getHousehold(id: string): Promise<AdminHouseholdResponse> {
    const household = await this.prisma.household.findUnique({
      where: { id },
      include: { users: true },
    });
    if (!household) {
      throw new NotFoundException('Household not found');
    }
    return this.toAdminHouseholdResponse(household as HouseholdWithUsers);
  }

  async createHousehold(dto: AdminCreateHouseholdDto): Promise<AdminHouseholdResponse> {
    const household = await this.prisma.household.create({
      data: { name: dto.name },
      include: { users: true },
    });
    return this.toAdminHouseholdResponse(household as HouseholdWithUsers);
  }

  async updateHousehold(id: string, dto: AdminUpdateHouseholdDto): Promise<AdminHouseholdResponse> {
    const existing = await this.prisma.household.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Household not found');
    }
    const household = await this.prisma.household.update({
      where: { id },
      data: dto,
      include: { users: true },
    });
    return this.toAdminHouseholdResponse(household as HouseholdWithUsers);
  }

  async deleteHousehold(id: string): Promise<void> {
    const existing = await this.prisma.household.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Household not found');
    }
    await this.prisma.household.delete({ where: { id } });
  }

  private toAdminHouseholdResponse(household: HouseholdWithUsers): AdminHouseholdResponse {
    return {
      id: household.id,
      name: household.name,
      members: household.users.map((u) => this.toMemberResponse(u)),
      memberCount: household.users.length,
      createdAt: household.createdAt.toISOString(),
      updatedAt: household.updatedAt.toISOString(),
    };
  }

  private toMemberResponse(user: {
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
      dateOfBirth:
        user.dateOfBirth instanceof Date
          ? user.dateOfBirth.toISOString().split('T')[0]
          : null,
      canLogin: !!user.passwordHash,
    };
  }
}
