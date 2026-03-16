import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MealPlanEntryResponse, MealPlanResponse, MealType } from '@recipe-manager/shared';
import { CreateMealPlanEntryDto } from './dto/create-meal-plan-entry.dto';
import { UpdateMealPlanEntryDto } from './dto/update-meal-plan-entry.dto';

function toMealPlanEntryResponse(entry: any): MealPlanEntryResponse {
  return {
    id: entry.id,
    date: entry.date instanceof Date
      ? entry.date.toISOString().split('T')[0]
      : String(entry.date).split('T')[0],
    mealType: entry.mealType as MealType,
    recipeId: entry.recipeId,
    recipeName: entry.recipe.name,
    recipeSlug: entry.recipe.slug,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

const ENTRY_INCLUDE = {
  recipe: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class MealPlanService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateMealPlan(householdId: string) {
    return this.prisma.mealPlan.upsert({
      where: { householdId },
      create: { householdId },
      update: {},
    });
  }

  async getEntries(householdId: string, from?: string, to?: string): Promise<MealPlanResponse> {
    const mealPlan = await this.prisma.mealPlan.findUnique({ where: { householdId } });
    if (!mealPlan) return { entries: [] };

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const entries = await this.prisma.mealPlanEntry.findMany({
      where: {
        mealPlanId: mealPlan.id,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
      include: ENTRY_INCLUDE,
    });

    return { entries: entries.map(toMealPlanEntryResponse) };
  }

  async createEntry(householdId: string, dto: CreateMealPlanEntryDto): Promise<MealPlanEntryResponse> {
    const mealPlan = await this.getOrCreateMealPlan(householdId);
    const entry = await this.prisma.mealPlanEntry.create({
      data: {
        mealPlanId: mealPlan.id,
        recipeId: dto.recipeId,
        date: new Date(dto.date),
        mealType: dto.mealType,
      },
      include: ENTRY_INCLUDE,
    });
    return toMealPlanEntryResponse(entry);
  }

  private async findEntryAndVerifyOwnership(entryId: string, householdId: string) {
    const entry = await this.prisma.mealPlanEntry.findUnique({
      where: { id: entryId },
      include: { mealPlan: true, ...ENTRY_INCLUDE },
    });
    if (!entry) throw new NotFoundException(`Meal plan entry ${entryId} not found`);
    if (entry.mealPlan.householdId !== householdId) throw new ForbiddenException('Access denied');
    return entry;
  }

  async updateEntry(entryId: string, householdId: string, dto: UpdateMealPlanEntryDto): Promise<MealPlanEntryResponse> {
    await this.findEntryAndVerifyOwnership(entryId, householdId);
    const updated = await this.prisma.mealPlanEntry.update({
      where: { id: entryId },
      data: {
        ...(dto.recipeId !== undefined && { recipeId: dto.recipeId }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.mealType !== undefined && { mealType: dto.mealType }),
      },
      include: ENTRY_INCLUDE,
    });
    return toMealPlanEntryResponse(updated);
  }

  async deleteEntry(entryId: string, householdId: string): Promise<{ id: string }> {
    await this.findEntryAndVerifyOwnership(entryId, householdId);
    await this.prisma.mealPlanEntry.delete({ where: { id: entryId } });
    return { id: entryId };
  }
}
