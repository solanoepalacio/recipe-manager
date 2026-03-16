import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyRecipeOwnership(recipeId: string, householdId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    return recipe;
  }

  async create(recipeId: string, householdId: string, sectionId: string, dto: CreateIngredientDto) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const section = await this.prisma.ingredientSection.findUnique({ where: { id: sectionId } });
    if (!section || section.recipeId !== recipeId) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }
    const maxOrder = await this.prisma.recipeIngredient.aggregate({
      where: { sectionId },
      _max: { order: true },
    });
    return this.prisma.recipeIngredient.create({
      data: {
        sectionId,
        foodId: dto.foodId,
        unitId: dto.unitId ?? null,
        quantity: dto.quantity ?? null,
        note: dto.note ?? null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { food: true, unit: true },
    });
  }

  async update(
    recipeId: string,
    householdId: string,
    sectionId: string,
    ingredientId: string,
    dto: UpdateIngredientDto,
  ) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const ingredient = await this.prisma.recipeIngredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient || ingredient.sectionId !== sectionId) {
      throw new NotFoundException(`Ingredient ${ingredientId} not found`);
    }
    return this.prisma.recipeIngredient.update({
      where: { id: ingredientId },
      data: {
        ...(dto.foodId !== undefined && { foodId: dto.foodId }),
        ...(dto.unitId !== undefined && { unitId: dto.unitId }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: { food: true, unit: true },
    });
  }

  async remove(recipeId: string, householdId: string, sectionId: string, ingredientId: string) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const ingredient = await this.prisma.recipeIngredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient || ingredient.sectionId !== sectionId) {
      throw new NotFoundException(`Ingredient ${ingredientId} not found`);
    }
    await this.prisma.recipeIngredient.delete({ where: { id: ingredientId } });
    return { id: ingredientId };
  }

  async reorder(recipeId: string, householdId: string, ids: string[]): Promise<void> {
    await this.verifyRecipeOwnership(recipeId, householdId);
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.recipeIngredient.update({ where: { id }, data: { order: index } }),
      ),
    );
  }
}
