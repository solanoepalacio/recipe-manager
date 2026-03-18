// apps/api/src/admin/households/admin-households.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminHouseholdResponse,
  AdminHouseholdDetailResponse,
  AdminUserResponse,
  PaginatedResponse,
} from '@recipe-manager/shared';
import { CreateAdminHouseholdDto } from './dto/create-household.dto';
import { UpdateAdminHouseholdDto } from './dto/update-household.dto';

function toAdminUserResponse(user: {
  id: string; householdId: string; name: string; email: string | null;
  username: string | null; gender: string | null; dateOfBirth: Date | null;
  createdAt: Date; updatedAt: Date;
}): AdminUserResponse {
  return {
    id: user.id, householdId: user.householdId, name: user.name,
    email: user.email, username: user.username, gender: user.gender,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString(),
  };
}

function toAdminHouseholdResponse(h: {
  id: string; name: string; createdAt: Date; updatedAt: Date; _count: { users: number };
}): AdminHouseholdResponse {
  return {
    id: h.id, name: h.name, memberCount: h._count.users,
    createdAt: h.createdAt.toISOString(), updatedAt: h.updatedAt.toISOString(),
  };
}

const USER_SELECT = {
  id: true, householdId: true, name: true, email: true, username: true,
  gender: true, dateOfBirth: true, createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class AdminHouseholdsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 20): Promise<PaginatedResponse<AdminHouseholdResponse>> {
    const [households, total] = await Promise.all([
      this.prisma.household.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true } } },
      }),
      this.prisma.household.count(),
    ]);
    return { items: households.map(toAdminHouseholdResponse), total, page, perPage };
  }

  async findOne(id: string): Promise<AdminHouseholdDetailResponse> {
    const household = await this.prisma.household.findUnique({
      where: { id },
      include: { users: { select: USER_SELECT } },
    });
    if (!household) throw new NotFoundException(`Household ${id} not found`);
    return {
      id: household.id, name: household.name,
      members: household.users.map(toAdminUserResponse),
      createdAt: household.createdAt.toISOString(),
      updatedAt: household.updatedAt.toISOString(),
    };
  }

  async create(dto: CreateAdminHouseholdDto): Promise<AdminHouseholdResponse> {
    const household = await this.prisma.household.create({
      data: { name: dto.name },
      include: { _count: { select: { users: true } } },
    });
    return toAdminHouseholdResponse(household);
  }

  async update(id: string, dto: UpdateAdminHouseholdDto): Promise<AdminHouseholdResponse> {
    const existing = await this.prisma.household.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Household ${id} not found`);
    const household = await this.prisma.household.update({
      where: { id },
      data: { name: dto.name },
      include: { _count: { select: { users: true } } },
    });
    return toAdminHouseholdResponse(household);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.household.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Household ${id} not found`);

    // Get recipe IDs in this household for sub-resource cascade
    const recipes = await this.prisma.recipe.findMany({
      where: { householdId: id },
      select: { id: true },
    });
    const recipeIds = (recipes ?? []).map((r) => r.id);

    await this.prisma.$transaction([
      // Cascade delete sub-resources in dependency order
      this.prisma.mealPlanEntry.deleteMany({ where: { mealPlan: { householdId: id } } }),
      this.prisma.mealPlan.deleteMany({ where: { householdId: id } }),
      this.prisma.recipeIngredient.deleteMany({ where: { section: { recipeId: { in: recipeIds } } } }),
      this.prisma.ingredientSection.deleteMany({ where: { recipeId: { in: recipeIds } } }),
      this.prisma.recipeImage.deleteMany({ where: { recipeId: { in: recipeIds } } }),
      this.prisma.instructionStep.deleteMany({ where: { recipeId: { in: recipeIds } } }),
      this.prisma.recipe.deleteMany({ where: { householdId: id } }),
      this.prisma.apiToken.deleteMany({ where: { user: { householdId: id } } }),
      this.prisma.user.deleteMany({ where: { householdId: id } }),
      this.prisma.household.delete({ where: { id } }),
    ]);
  }
}
