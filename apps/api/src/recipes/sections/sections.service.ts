import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyRecipe } from '../helpers/verify-recipe.helper';
import type {
  IngredientSectionResponse,
  RecipeIngredientResponse,
  CreateSectionRequest,
  UpdateSectionRequest,
} from '@recipe-manager/shared';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  private toSectionResponse(section: {
    id: string;
    title: string | null;
    order: number;
    ingredients: Array<{
      id: string;
      foodId: string;
      food: { name: string };
      unitId: string | null;
      unit: { name: string; abbreviation: string | null } | null;
      quantity: { toNumber(): number } | null;
      note: string | null;
      order: number;
    }>;
  }): IngredientSectionResponse {
    return {
      id: section.id,
      title: section.title,
      order: section.order,
      ingredients: section.ingredients.map(
        (i): RecipeIngredientResponse => ({
          id: i.id,
          foodId: i.foodId,
          foodName: i.food.name,
          unitId: i.unitId,
          unitName: i.unit?.name ?? null,
          unitAbbreviation: i.unit?.abbreviation ?? null,
          quantity: i.quantity ? i.quantity.toNumber() : null,
          note: i.note,
          order: i.order,
        }),
      ),
    };
  }

  private ingredientInclude() {
    return {
      orderBy: { order: 'asc' as const },
      include: { food: true, unit: true },
    };
  }

  async addSection(
    householdId: string,
    recipeId: string,
    dto: CreateSectionRequest,
  ): Promise<IngredientSectionResponse> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    const existing = await this.prisma.ingredientSection.findMany({
      where: { recipeId },
      select: { order: true },
    });

    const maxOrder = existing.length > 0 ? Math.max(...existing.map((s) => s.order)) : -1;

    const section = await this.prisma.ingredientSection.create({
      data: {
        recipeId,
        title: dto.title ?? null,
        order: maxOrder + 1,
      },
      include: { ingredients: this.ingredientInclude() },
    });

    return this.toSectionResponse(section);
  }

  async updateSection(
    householdId: string,
    recipeId: string,
    sectionId: string,
    dto: UpdateSectionRequest,
  ): Promise<IngredientSectionResponse> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    const section = await this.prisma.ingredientSection.findFirst({
      where: { id: sectionId, recipeId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const updated = await this.prisma.ingredientSection.update({
      where: { id: sectionId },
      data: { title: dto.title },
      include: { ingredients: this.ingredientInclude() },
    });

    return this.toSectionResponse(updated);
  }

  async deleteSection(
    householdId: string,
    recipeId: string,
    sectionId: string,
  ): Promise<void> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    const section = await this.prisma.ingredientSection.findFirst({
      where: { id: sectionId, recipeId },
    });
    if (!section) throw new NotFoundException('Section not found');

    await this.prisma.ingredientSection.delete({ where: { id: sectionId } });
  }

  async reorderSections(
    householdId: string,
    recipeId: string,
    ids: string[],
  ): Promise<void> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.ingredientSection.update({
          where: { id, recipeId },
          data: { order: index },
        }),
      ),
    );
  }
}
