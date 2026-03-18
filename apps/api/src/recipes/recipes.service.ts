import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecipeDetailResponse,
  RecipeListItem,
  PaginatedResponse,
  SectionResponse,
  IngredientResponse,
  StepResponse,
  ImageResponse,
} from '@recipe-manager/shared';
import { Prisma } from '@prisma/client';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeQueryDto, SortField, SortOrder } from './dto/recipe-query.dto';

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

const RECIPE_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  servingsQty: true,
  servingsUnit: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { images: true } },
  images: { take: 1, orderBy: { order: 'asc' as const }, select: { url: true } },
} as const;

function toRecipeListItem(recipe: any): RecipeListItem {
  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description ?? null,
    servingsQty: recipe.servingsQty ? Number(recipe.servingsQty) : null,
    servingsUnit: recipe.servingsUnit ?? null,
    shareToken: recipe.shareToken ?? null,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    imageCount: recipe._count.images,
    coverImageUrl: recipe.images?.[0]?.url ?? null,
  };
}

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
    totalTime: recipe.totalTime ?? (recipe.prepTime != null && recipe.cookTime != null ? recipe.prepTime + recipe.cookTime : null),
    performTime: recipe.performTime ?? null,
    sourceUrl: recipe.sourceUrl ?? null,
    isLocked: recipe.isLocked ?? false,
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

  async findAll(householdId: string, query: RecipeQueryDto = {}): Promise<PaginatedResponse<RecipeListItem>> {
    const { search, foodId, sort = SortField.CreatedAt, order = SortOrder.Desc, page = 1, pageSize = 20 } = query;

    const where: Prisma.RecipeWhereInput = {
      householdId,
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
      ...(foodId && {
        sections: {
          some: {
            ingredients: {
              some: { foodId },
            },
          },
        },
      }),
    };

    if (sort === SortField.Random) {
      // Random sort: fetch all matching IDs, shuffle in JS, slice for page, then fetch RecipeListItem data
      const allIds = await this.prisma.recipe.findMany({
        where,
        select: { id: true },
      });
      const shuffled = allIds.sort(() => Math.random() - 0.5);
      const pageIds = shuffled.slice((page - 1) * pageSize, page * pageSize).map((r) => r.id);
      const recipes = await this.prisma.recipe.findMany({
        where: { id: { in: pageIds } },
        select: RECIPE_LIST_SELECT,
      });
      // Restore shuffle order
      const recipeMap = new Map(recipes.map((r) => [r.id, r]));
      const orderedRecipes = pageIds.map((id) => recipeMap.get(id)).filter(Boolean);
      return {
        items: orderedRecipes.map(toRecipeListItem),
        total: allIds.length,
        page,
        perPage: pageSize,
      };
    }

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: RECIPE_LIST_SELECT,
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      items: recipes.map(toRecipeListItem),
      total,
      page,
      perPage: pageSize,
    };
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
        ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
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

  async duplicate(id: string, householdId: string, createdById: string): Promise<RecipeDetailResponse> {
    const original = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        sections: {
          include: { ingredients: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        steps: { orderBy: { order: 'asc' } },
      },
    });
    if (!original) throw new NotFoundException(`Recipe ${id} not found`);
    if (original.householdId !== householdId) throw new ForbiddenException('Access denied');

    const newName = `${original.name} (copia)`;
    const uniqueSlug = await this.generateUniqueSlug(newName, householdId);

    const recipe = await this.prisma.recipe.create({
      data: {
        householdId,
        createdById,
        name: newName,
        slug: uniqueSlug,
        description: original.description,
        servingsQty: original.servingsQty,
        servingsUnit: original.servingsUnit,
        prepTime: original.prepTime,
        cookTime: original.cookTime,
        totalTime: original.totalTime,
        performTime: original.performTime,
        sourceUrl: original.sourceUrl,
        sections: {
          create: original.sections.map((s, si) => ({
            title: s.title,
            order: si,
            ingredients: {
              create: s.ingredients.map((ing, ii) => ({
                foodId: ing.foodId,
                unitId: ing.unitId,
                quantity: ing.quantity,
                note: ing.note,
                order: ii,
              })),
            },
          })),
        },
        steps: {
          create: original.steps.map((step, i) => ({
            title: step.title,
            body: step.body,
            order: i,
          })),
        },
      },
      include: RECIPE_INCLUDE,
    });
    return toRecipeDetailResponse(recipe);
  }

}
