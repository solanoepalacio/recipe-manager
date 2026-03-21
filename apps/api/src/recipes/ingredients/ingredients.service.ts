import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { BatchCreateIngredientsDto } from './dto/batch-create-ingredient.dto';
import { SectionResponse, IngredientResponse } from '@recipe-manager/shared';

const SECTION_WITH_INGREDIENTS_INCLUDE = {
  ingredients: {
    include: { food: true, unit: true },
    orderBy: { order: 'asc' as const },
  },
} as const;

function toIngredientResponse(ing: {
  id: string;
  foodId: string;
  food: { name: string };
  unitId: string | null;
  unit: { name: string } | null;
  quantity: { toNumber(): number } | null;
  note: string | null;
  order: number;
}): IngredientResponse {
  return {
    id: ing.id,
    foodId: ing.foodId,
    foodName: ing.food.name,
    unitId: ing.unitId,
    unitName: ing.unit?.name ?? null,
    quantity: ing.quantity ? ing.quantity.toNumber() : null,
    note: ing.note,
    order: ing.order,
  };
}

function toSectionResponse(section: {
  id: string;
  title: string | null;
  order: number;
  ingredients: Parameters<typeof toIngredientResponse>[0][];
}): SectionResponse {
  return {
    id: section.id,
    title: section.title,
    order: section.order,
    ingredients: section.ingredients.map(toIngredientResponse),
  };
}

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

  async batchCreate(
    recipeId: string,
    householdId: string,
    sectionId: string,
    dto: BatchCreateIngredientsDto,
  ): Promise<SectionResponse> {
    await this.verifyRecipeOwnership(recipeId, householdId);

    if (dto.ingredients.length === 0) {
      const section = await this.prisma.ingredientSection.findUnique({
        where: { id: sectionId },
        include: SECTION_WITH_INGREDIENTS_INCLUDE,
      });
      if (!section || section.recipeId !== recipeId) {
        throw new NotFoundException(`Section ${sectionId} not found`);
      }
      return toSectionResponse(section as any);
    }

    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const section = await tx.ingredientSection.findUnique({ where: { id: sectionId } });
        if (!section || section.recipeId !== recipeId) {
          throw new NotFoundException(`Section ${sectionId} not found`);
        }

        const maxOrder = await tx.recipeIngredient.aggregate({
          where: { sectionId },
          _max: { order: true },
        });
        const startOrder = (maxOrder._max.order ?? -1) + 1;

        await tx.recipeIngredient.createMany({
          data: dto.ingredients.map((item: any, i: number) => ({
            sectionId,
            foodId: item.foodId,
            unitId: item.unitId ?? null,
            quantity: item.quantity ?? null,
            note: item.note ?? null,
            order: startOrder + i,
          })),
        });

        const updated = await tx.ingredientSection.findUnique({
          where: { id: sectionId },
          include: SECTION_WITH_INGREDIENTS_INCLUDE,
        });

        return toSectionResponse(updated as any);
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Invalid food or unit ID');
      }
      throw error;
    }
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
