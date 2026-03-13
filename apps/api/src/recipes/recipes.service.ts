import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  RecipeListItemResponse,
  RecipeDetailResponse,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  DuplicateRecipeResponse,
  PaginatedResponse,
  IngredientSectionResponse,
  RecipeIngredientResponse,
  InstructionStepResponse,
  RecipeImageResponse,
} from '@recipe-manager/shared';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async uniqueSlug(
    householdId: string,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.generateSlug(name);
    let slug = base;
    let n = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.recipe.findFirst({
        where: {
          householdId,
          slug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });
      if (!existing) return slug;
      slug = `${base}-${n++}`;
    }
  }

  private toListItem(recipe: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    prepTime: number | null;
    cookTime: number | null;
    totalTime: number | null;
    servingsQty: { toNumber(): number } | null;
    servingsUnit: string | null;
    images: Array<{ url: string }>;
    createdAt: Date;
    updatedAt: Date;
  }): RecipeListItemResponse {
    return {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      servingsQty: recipe.servingsQty ? recipe.servingsQty.toNumber() : null,
      servingsUnit: recipe.servingsUnit,
      thumbnailUrl: recipe.images?.[0]?.url ?? null,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
    };
  }

  private toDetail(recipe: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    prepTime: number | null;
    cookTime: number | null;
    totalTime: number | null;
    performTime: number | null;
    servingsQty: { toNumber(): number } | null;
    servingsUnit: string | null;
    sourceUrl: string | null;
    isLocked: boolean;
    landscapeView: boolean;
    shareToken: string | null;
    sections: Array<{
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
    }>;
    steps: Array<{
      id: string;
      title: string | null;
      body: string;
      order: number;
    }>;
    images: Array<{
      id: string;
      url: string;
      order: number;
      createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): RecipeDetailResponse {
    return {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      performTime: recipe.performTime,
      servingsQty: recipe.servingsQty ? recipe.servingsQty.toNumber() : null,
      servingsUnit: recipe.servingsUnit,
      sourceUrl: recipe.sourceUrl,
      isLocked: recipe.isLocked,
      landscapeView: recipe.landscapeView,
      shareToken: recipe.shareToken,
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
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
    };
  }

  private recipeDetailInclude() {
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

  async listRecipes(
    householdId: string,
    query: {
      q?: string;
      foodId?: string;
      sort?: string;
      order?: string;
      page?: number;
      perPage?: number;
    },
  ): Promise<PaginatedResponse<RecipeListItemResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = { householdId };
    if (query.q) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }
    if (query.foodId) {
      where.sections = {
        some: { ingredients: { some: { foodId: query.foodId } } },
      };
    }

    const sort = query.sort ?? 'updatedAt';
    const order = query.order ?? 'desc';

    // For random sort we fetch with a stable order and shuffle in memory
    const orderBy =
      sort === 'random' ? { createdAt: 'desc' as const } : { [sort]: order };

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: { images: { orderBy: { order: 'asc' as const }, take: 1 } },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    let items = recipes.map(this.toListItem.bind(this));
    if (sort === 'random') {
      items = items.sort(() => Math.random() - 0.5);
    }

    return { items, total, page, perPage };
  }

  async createRecipe(
    householdId: string,
    userId: string,
    dto: CreateRecipeRequest,
  ): Promise<RecipeDetailResponse> {
    const slug = await this.uniqueSlug(householdId, dto.name);

    const recipe = await this.prisma.recipe.create({
      data: {
        householdId,
        createdById: userId,
        name: dto.name,
        slug,
        description: dto.description,
        prepTime: dto.prepTime,
        cookTime: dto.cookTime,
        totalTime: dto.totalTime,
        servingsQty: dto.servingsQty,
        servingsUnit: dto.servingsUnit,
        sourceUrl: dto.sourceUrl,
        // Create one default section (empty, no title)
        sections: { create: { title: null, order: 0 } },
      },
      include: this.recipeDetailInclude(),
    });

    return this.toDetail(recipe);
  }

  async getRecipe(
    householdId: string,
    id: string,
  ): Promise<RecipeDetailResponse> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, householdId },
      include: this.recipeDetailInclude(),
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return this.toDetail(recipe);
  }

  async updateRecipe(
    householdId: string,
    id: string,
    dto: UpdateRecipeRequest,
  ): Promise<RecipeDetailResponse> {
    const exists = await this.prisma.recipe.findFirst({
      where: { id, householdId },
    });
    if (!exists) throw new NotFoundException('Recipe not found');

    // Build the update data object, handling slug separately
    const { name, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };

    if (name !== undefined) {
      data.name = name;
      if (name !== exists.name) {
        data.slug = await this.uniqueSlug(householdId, name, id);
      }
    }

    const recipe = await this.prisma.recipe.update({
      where: { id },
      data,
      include: this.recipeDetailInclude(),
    });

    return this.toDetail(recipe);
  }

  async deleteRecipe(householdId: string, id: string): Promise<void> {
    const exists = await this.prisma.recipe.findFirst({
      where: { id, householdId },
    });
    if (!exists) throw new NotFoundException('Recipe not found');
    await this.prisma.recipe.delete({ where: { id } });
  }

  async duplicateRecipe(
    householdId: string,
    id: string,
    userId: string,
  ): Promise<DuplicateRecipeResponse> {
    const original = await this.prisma.recipe.findFirst({
      where: { id, householdId },
      include: this.recipeDetailInclude(),
    });
    if (!original) throw new NotFoundException('Recipe not found');

    const newName = `${original.name} (copia)`;
    const slug = await this.uniqueSlug(householdId, newName);

    const duplicate = await this.prisma.recipe.create({
      data: {
        householdId,
        createdById: userId,
        name: newName,
        slug,
        description: original.description,
        prepTime: original.prepTime,
        cookTime: original.cookTime,
        totalTime: original.totalTime,
        performTime: original.performTime,
        servingsQty: original.servingsQty,
        servingsUnit: original.servingsUnit,
        sourceUrl: original.sourceUrl,
        sections: {
          create: original.sections.map((s) => ({
            title: s.title,
            order: s.order,
            ingredients: {
              create: s.ingredients.map((i) => ({
                foodId: i.foodId,
                unitId: i.unitId,
                quantity: i.quantity,
                note: i.note,
                order: i.order,
              })),
            },
          })),
        },
        steps: {
          create: original.steps.map((s) => ({
            title: s.title,
            body: s.body,
            order: s.order,
          })),
        },
      },
    });

    return { id: duplicate.id, slug: duplicate.slug, name: duplicate.name };
  }
}
