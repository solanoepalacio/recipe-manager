import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyRecipe } from '../helpers/verify-recipe.helper';
import type {
  RecipeIngredientResponse,
  CreateIngredientRequest,
  UpdateIngredientRequest,
} from '@recipe-manager/shared';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  private toIngredientResponse(ingredient: {
    id: string;
    foodId: string;
    food: { name: string };
    unitId: string | null;
    unit: { name: string; abbreviation: string | null } | null;
    quantity: { toNumber(): number } | null;
    note: string | null;
    order: number;
  }): RecipeIngredientResponse {
    return {
      id: ingredient.id,
      foodId: ingredient.foodId,
      foodName: ingredient.food.name,
      unitId: ingredient.unitId,
      unitName: ingredient.unit?.name ?? null,
      unitAbbreviation: ingredient.unit?.abbreviation ?? null,
      quantity: ingredient.quantity ? ingredient.quantity.toNumber() : null,
      note: ingredient.note,
      order: ingredient.order,
    };
  }

  private ingredientInclude() {
    return { food: true, unit: true };
  }

  private async verifySection(
    recipeId: string,
    sectionId: string,
  ) {
    const section = await this.prisma.ingredientSection.findFirst({
      where: { id: sectionId, recipeId },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async addIngredient(
    householdId: string,
    recipeId: string,
    sectionId: string,
    dto: CreateIngredientRequest,
  ): Promise<RecipeIngredientResponse> {
    await verifyRecipe(this.prisma, householdId, recipeId);
    await this.verifySection(recipeId, sectionId);

    const existing = await this.prisma.recipeIngredient.findMany({
      where: { sectionId },
      select: { order: true },
    });

    const maxOrder =
      existing.length > 0 ? Math.max(...existing.map((i) => i.order)) : -1;

    const ingredient = await this.prisma.recipeIngredient.create({
      data: {
        sectionId,
        foodId: dto.foodId,
        unitId: dto.unitId ?? null,
        quantity: dto.quantity ?? null,
        note: dto.note ?? null,
        order: maxOrder + 1,
      },
      include: this.ingredientInclude(),
    });

    return this.toIngredientResponse(ingredient);
  }

  async updateIngredient(
    householdId: string,
    recipeId: string,
    sectionId: string,
    ingredientId: string,
    dto: UpdateIngredientRequest,
  ): Promise<RecipeIngredientResponse> {
    await verifyRecipe(this.prisma, householdId, recipeId);
    await this.verifySection(recipeId, sectionId);

    const ingredient = await this.prisma.recipeIngredient.findFirst({
      where: { id: ingredientId, sectionId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    const updated = await this.prisma.recipeIngredient.update({
      where: { id: ingredientId },
      data: {
        ...(dto.foodId !== undefined && { foodId: dto.foodId }),
        ...(dto.unitId !== undefined && { unitId: dto.unitId }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: this.ingredientInclude(),
    });

    return this.toIngredientResponse(updated);
  }

  async deleteIngredient(
    householdId: string,
    recipeId: string,
    sectionId: string,
    ingredientId: string,
  ): Promise<void> {
    await verifyRecipe(this.prisma, householdId, recipeId);
    await this.verifySection(recipeId, sectionId);

    const ingredient = await this.prisma.recipeIngredient.findFirst({
      where: { id: ingredientId, sectionId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    await this.prisma.recipeIngredient.delete({ where: { id: ingredientId } });
  }

  async reorderIngredients(
    householdId: string,
    recipeId: string,
    sectionId: string,
    ids: string[],
  ): Promise<void> {
    await verifyRecipe(this.prisma, householdId, recipeId);
    await this.verifySection(recipeId, sectionId);

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.recipeIngredient.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
  }
}
