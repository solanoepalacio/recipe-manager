import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ShareRecipeResponse,
  SharedRecipeResponse,
  IngredientSectionResponse,
  RecipeIngredientResponse,
  InstructionStepResponse,
  RecipeImageResponse,
} from '@recipe-manager/shared';

@Injectable()
export class SharingService {
  constructor(private prisma: PrismaService) {}

  private sharedRecipeInclude() {
    return {
      sections: {
        orderBy: { order: 'asc' as const },
        include: {
          ingredients: {
            orderBy: { order: 'asc' as const },
            include: { food: true, unit: true },
          },
        },
      },
      steps: { orderBy: { order: 'asc' as const } },
      images: { orderBy: { order: 'asc' as const } },
    };
  }

  async shareRecipe(
    householdId: string,
    recipeId: string,
  ): Promise<ShareRecipeResponse> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const token = randomUUID();

    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { shareToken: token },
    });

    const frontendUrl =
      process.env.FRONTEND_URL ?? 'http://localhost:3001';

    return {
      shareToken: token,
      shareUrl: `${frontendUrl}/shared/${token}`,
    };
  }

  async revokeShare(householdId: string, recipeId: string): Promise<void> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { shareToken: null },
    });
  }

  async getSharedRecipe(token: string): Promise<SharedRecipeResponse> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { shareToken: token },
      include: this.sharedRecipeInclude(),
    });
    if (!recipe) throw new NotFoundException('Shared recipe not found');

    return {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      servingsQty: recipe.servingsQty
        ? recipe.servingsQty.toNumber()
        : null,
      servingsUnit: recipe.servingsUnit,
      sections: recipe.sections.map(
        (s): IngredientSectionResponse => ({
          id: s.id,
          title: s.title,
          order: s.order,
          ingredients: s.ingredients.map(
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
        }),
      ),
      steps: recipe.steps.map(
        (s): InstructionStepResponse => ({
          id: s.id,
          title: s.title,
          body: s.body,
          order: s.order,
        }),
      ),
      images: recipe.images.map(
        (img): RecipeImageResponse => ({
          id: img.id,
          url: img.url,
          order: img.order,
          createdAt: img.createdAt.toISOString(),
        }),
      ),
    };
  }
}
