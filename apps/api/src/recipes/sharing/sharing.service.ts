import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { toRecipeDetailResponse } from '../recipes.service';
import { RecipeDetailResponse } from '@recipe-manager/shared';

const SHARING_RECIPE_INCLUDE = {
  sections: {
    include: {
      ingredients: {
        include: { food: true, unit: true },
        orderBy: { order: 'asc' as const },
      },
    },
    orderBy: { order: 'asc' as const },
  },
  steps: { orderBy: { order: 'asc' as const } },
  images: { orderBy: { order: 'asc' as const } },
} as const;

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  async generateToken(recipeId: string, householdId: string): Promise<{ shareToken: string }> {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');

    if (recipe.shareToken) return { shareToken: recipe.shareToken };

    const token = randomBytes(32).toString('hex');
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { shareToken: token },
    });
    return { shareToken: token };
  }

  async revokeToken(recipeId: string, householdId: string): Promise<void> {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    await this.prisma.recipe.update({ where: { id: recipeId }, data: { shareToken: null } });
  }

  async findByToken(token: string): Promise<RecipeDetailResponse> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { shareToken: token },
      include: SHARING_RECIPE_INCLUDE,
    });
    if (!recipe) throw new NotFoundException('Shared recipe not found');
    return toRecipeDetailResponse(recipe);
  }
}
