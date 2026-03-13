import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  MealPlanResponse,
  MealPlanEntryResponse,
  CreateMealPlanEntryRequest,
  UpdateMealPlanEntryRequest,
} from '@recipe-manager/shared';

@Injectable()
export class MealPlanService {
  constructor(private prisma: PrismaService) {}

  private toEntry(entry: {
    id: string;
    recipeId: string;
    date: Date | string;
    mealType: string;
    recipe: {
      id: string;
      name: string;
      images: Array<{ url: string }>;
    };
  }): MealPlanEntryResponse {
    const dateStr =
      entry.date instanceof Date
        ? entry.date.toISOString().split('T')[0]
        : entry.date;

    return {
      id: entry.id,
      recipeId: entry.recipeId,
      recipeName: entry.recipe.name,
      recipeThumbnailUrl: entry.recipe.images?.[0]?.url ?? null,
      date: dateStr,
      // mealType is stored as string in DB but conforms to MealType enum
      mealType: entry.mealType as MealPlanEntryResponse['mealType'],
    };
  }

  private entryInclude() {
    return {
      recipe: {
        select: {
          id: true,
          name: true,
          images: {
            orderBy: { order: 'asc' as const },
            take: 1,
            select: { url: true },
          },
        },
      },
    };
  }

  async getMealPlan(
    householdId: string,
    from?: string,
    to?: string,
  ): Promise<MealPlanResponse> {
    const mealPlan = await this.prisma.mealPlan.upsert({
      where: { householdId },
      create: { householdId },
      update: {},
    });

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const entries = await this.prisma.mealPlanEntry.findMany({
      where: {
        mealPlanId: mealPlan.id,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: 'asc' },
      include: this.entryInclude(),
    });

    return { entries: entries.map((e) => this.toEntry(e)) };
  }

  async addEntry(
    householdId: string,
    dto: CreateMealPlanEntryRequest,
  ): Promise<MealPlanEntryResponse> {
    const mealPlan = await this.prisma.mealPlan.upsert({
      where: { householdId },
      create: { householdId },
      update: {},
    });

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: dto.recipeId, householdId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const entry = await this.prisma.mealPlanEntry.create({
      data: {
        mealPlanId: mealPlan.id,
        recipeId: dto.recipeId,
        date: new Date(dto.date),
        mealType: dto.mealType,
      },
      include: this.entryInclude(),
    });

    return this.toEntry(entry);
  }

  async updateEntry(
    householdId: string,
    entryId: string,
    dto: UpdateMealPlanEntryRequest,
  ): Promise<MealPlanEntryResponse> {
    const existing = await this.prisma.mealPlanEntry.findFirst({
      where: {
        id: entryId,
        mealPlan: { householdId },
      },
    });
    if (!existing) throw new NotFoundException('Meal plan entry not found');

    const data: Record<string, unknown> = {};
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.mealType !== undefined) data.mealType = dto.mealType;

    const updated = await this.prisma.mealPlanEntry.update({
      where: { id: entryId },
      data,
      include: this.entryInclude(),
    });

    return this.toEntry(updated);
  }

  async deleteEntry(householdId: string, entryId: string): Promise<void> {
    const existing = await this.prisma.mealPlanEntry.findFirst({
      where: {
        id: entryId,
        mealPlan: { householdId },
      },
    });
    if (!existing) throw new NotFoundException('Meal plan entry not found');

    await this.prisma.mealPlanEntry.delete({ where: { id: entryId } });
  }
}
