import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecipeDetailResponse,
  SectionResponse,
  IngredientResponse,
  StepResponse,
  ImageResponse,
} from '@recipe-manager/shared';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

const RECIPE_INCLUDE = {
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

function toImageResponse(img: {
  id: string;
  url: string;
  order: number;
  createdAt: Date;
}): ImageResponse {
  return { id: img.id, url: img.url, order: img.order, createdAt: img.createdAt.toISOString() };
}

function toStepResponse(step: {
  id: string;
  title: string | null;
  body: string;
  order: number;
}): StepResponse {
  return { id: step.id, title: step.title, body: step.body, order: step.order };
}

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

export function toRecipeDetailResponse(recipe: any): RecipeDetailResponse {
  return {
    id: recipe.id,
    householdId: recipe.householdId,
    createdById: recipe.createdById,
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description ?? null,
    servingsQty: recipe.servingsQty ? Number(recipe.servingsQty) : null,
    servingsUnit: recipe.servingsUnit ?? null,
    prepTime: recipe.prepTime ?? null,
    cookTime: recipe.cookTime ?? null,
    totalTime: recipe.totalTime ?? null,
    performTime: recipe.performTime ?? null,
    sourceUrl: recipe.sourceUrl ?? null,
    shareToken: recipe.shareToken ?? null,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    sections: (recipe.sections ?? []).map(toSectionResponse),
    steps: (recipe.steps ?? []).map(toStepResponse),
    images: (recipe.images ?? []).map(toImageResponse),
  };
}

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(name: string, householdId: string): Promise<string> {
    const base = this.toSlug(name);
    let candidate = base;
    let counter = 2;
    while (await this.prisma.recipe.findFirst({ where: { householdId, slug: candidate } })) {
      candidate = `${base}-${counter++}`;
    }
    return candidate;
  }

  async findAndVerifyOwnership(recipeId: string, householdId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: RECIPE_INCLUDE,
    });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    return recipe;
  }

  async create(userId: string, householdId: string, dto: CreateRecipeDto): Promise<RecipeDetailResponse> {
    const slug = await this.generateUniqueSlug(dto.name, householdId);
    const recipe = await this.prisma.recipe.create({
      data: {
        householdId,
        createdById: userId,
        name: dto.name,
        slug,
        description: dto.description,
        servingsQty: dto.servingsQty,
        servingsUnit: dto.servingsUnit,
        prepTime: dto.prepTime,
        cookTime: dto.cookTime,
        totalTime: dto.totalTime,
        performTime: dto.performTime,
        sourceUrl: dto.sourceUrl,
      },
      include: RECIPE_INCLUDE,
    });
    return toRecipeDetailResponse(recipe);
  }

  async findAll(householdId: string): Promise<RecipeDetailResponse[]> {
    const recipes = await this.prisma.recipe.findMany({
      where: { householdId },
      include: RECIPE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return recipes.map(toRecipeDetailResponse);
  }

  async findOne(id: string, householdId: string): Promise<RecipeDetailResponse> {
    const recipe = await this.findAndVerifyOwnership(id, householdId);
    return toRecipeDetailResponse(recipe);
  }

  async update(id: string, householdId: string, dto: UpdateRecipeDto): Promise<RecipeDetailResponse> {
    await this.findAndVerifyOwnership(id, householdId);
    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.servingsQty !== undefined && { servingsQty: dto.servingsQty }),
        ...(dto.servingsUnit !== undefined && { servingsUnit: dto.servingsUnit }),
        ...(dto.prepTime !== undefined && { prepTime: dto.prepTime }),
        ...(dto.cookTime !== undefined && { cookTime: dto.cookTime }),
        ...(dto.totalTime !== undefined && { totalTime: dto.totalTime }),
        ...(dto.performTime !== undefined && { performTime: dto.performTime }),
        ...(dto.sourceUrl !== undefined && { sourceUrl: dto.sourceUrl }),
      },
      include: RECIPE_INCLUDE,
    });
    return toRecipeDetailResponse(recipe);
  }

  async remove(id: string, householdId: string): Promise<{ id: string }> {
    await this.findAndVerifyOwnership(id, householdId);
    await this.prisma.recipe.delete({ where: { id } });
    return { id };
  }

}
