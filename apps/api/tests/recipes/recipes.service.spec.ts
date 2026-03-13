import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../src/recipes/recipes.service';
import type {
  RecipeDetailResponse,
  RecipeListItemResponse,
  PaginatedResponse,
  DuplicateRecipeResponse,
} from '@recipe-manager/shared';

const makeImage = (overrides = {}) => ({
  id: 'img-1',
  url: 'https://example.com/img.jpg',
  order: 0,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const makeSection = (overrides = {}) => ({
  id: 'sec-1',
  title: null,
  order: 0,
  ingredients: [],
  ...overrides,
});

const makeIngredient = (overrides = {}) => ({
  id: 'ing-1',
  foodId: 'food-1',
  food: { id: 'food-1', name: 'Chicken' },
  unitId: 'unit-1',
  unit: { id: 'unit-1', name: 'gram', abbreviation: 'g' },
  quantity: { toNumber: () => 200 } as any,
  note: null,
  order: 0,
  ...overrides,
});

const makeStep = (overrides = {}) => ({
  id: 'step-1',
  title: null,
  body: 'Cook for 20 minutes',
  order: 0,
  ...overrides,
});

const makeRecipe = (overrides: Record<string, unknown> = {}) => ({
  id: 'recipe-1',
  householdId: 'household-1',
  createdById: 'user-1',
  name: 'Test Recipe',
  slug: 'test-recipe',
  description: null,
  prepTime: null,
  cookTime: null,
  totalTime: null,
  performTime: null,
  servingsQty: null,
  servingsUnit: null,
  sourceUrl: null,
  isLocked: false,
  landscapeView: false,
  shareToken: null,
  sections: [makeSection()],
  steps: [],
  images: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  ...overrides,
});

describe('RecipesService', () => {
  let service: RecipesService;
  let mockPrisma: {
    recipe: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      recipe: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new RecipesService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // listRecipes
  // ────────────────────────────────────────────────────────────────────────────

  describe('listRecipes', () => {
    it('returns PaginatedResponse with defaults', async () => {
      const recipe = makeRecipe({ images: [makeImage()] });
      mockPrisma.recipe.findMany.mockResolvedValue([recipe]);
      mockPrisma.recipe.count.mockResolvedValue(1);

      const result: PaginatedResponse<RecipeListItemResponse> =
        await service.listRecipes('household-1', {});

      expect(result.page).toBe(1);
      expect(result.perPage).toBe(20);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].thumbnailUrl).toBe('https://example.com/img.jpg');
    });

    it('returns null thumbnailUrl when no images', async () => {
      const recipe = makeRecipe({ images: [] });
      mockPrisma.recipe.findMany.mockResolvedValue([recipe]);
      mockPrisma.recipe.count.mockResolvedValue(1);

      const result = await service.listRecipes('household-1', {});

      expect(result.items[0].thumbnailUrl).toBeNull();
    });

    it('filters by q (name search)', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.listRecipes('household-1', { q: 'chicken' });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'chicken', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('filters by foodId', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.listRecipes('household-1', { foodId: 'food-abc' });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sections: {
              some: {
                ingredients: { some: { foodId: 'food-abc' } },
              },
            },
          }),
        }),
      );
    });

    it('sorts by name asc', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.listRecipes('household-1', { sort: 'name', order: 'asc' });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('handles random sort (returns items in any order)', async () => {
      const recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2' })];
      mockPrisma.recipe.findMany.mockResolvedValue(recipes);
      mockPrisma.recipe.count.mockResolvedValue(2);

      const result = await service.listRecipes('household-1', { sort: 'random' });

      expect(result.items).toHaveLength(2);
    });

    it('applies pagination', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(50);

      await service.listRecipes('household-1', { page: 3, perPage: 10 });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // createRecipe
  // ────────────────────────────────────────────────────────────────────────────

  describe('createRecipe', () => {
    it('creates recipe with auto-generated slug', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null); // no slug conflict
      const created = makeRecipe({ slug: 'my-recipe', name: 'My Recipe' });
      mockPrisma.recipe.create.mockResolvedValue(created);

      const result: RecipeDetailResponse = await service.createRecipe(
        'household-1',
        'user-1',
        { name: 'My Recipe' },
      );

      expect(mockPrisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'my-recipe', name: 'My Recipe' }),
        }),
      );
      expect(result.id).toBe('recipe-1');
    });

    it('creates a default section', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);
      const created = makeRecipe({});
      mockPrisma.recipe.create.mockResolvedValue(created);

      await service.createRecipe('household-1', 'user-1', { name: 'Test' });

      expect(mockPrisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sections: { create: { title: null, order: 0 } },
          }),
        }),
      );
    });

    it('appends -2 to slug when conflict exists', async () => {
      // First call: slug exists, second call: slug-2 doesn't exist
      mockPrisma.recipe.findFirst
        .mockResolvedValueOnce({ id: 'other' }) // 'test-recipe' taken
        .mockResolvedValueOnce(null); // 'test-recipe-2' free
      const created = makeRecipe({ slug: 'test-recipe-2' });
      mockPrisma.recipe.create.mockResolvedValue(created);

      await service.createRecipe('household-1', 'user-1', { name: 'Test Recipe' });

      expect(mockPrisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test-recipe-2' }),
        }),
      );
    });

    it('returns RecipeDetailResponse shape', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);
      const img = makeImage();
      const section = makeSection({ ingredients: [makeIngredient()] });
      const step = makeStep();
      const created = makeRecipe({
        sections: [section],
        steps: [step],
        images: [img],
      });
      mockPrisma.recipe.create.mockResolvedValue(created);

      const result = await service.createRecipe('household-1', 'user-1', {
        name: 'Test Recipe',
      });

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].ingredients).toHaveLength(1);
      expect(result.steps).toHaveLength(1);
      expect(result.images).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getRecipe
  // ────────────────────────────────────────────────────────────────────────────

  describe('getRecipe', () => {
    it('returns RecipeDetailResponse', async () => {
      const recipe = makeRecipe({});
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);

      const result: RecipeDetailResponse = await service.getRecipe(
        'household-1',
        'recipe-1',
      );

      expect(result.id).toBe('recipe-1');
      expect(result.slug).toBe('test-recipe');
    });

    it('throws NotFoundException when recipe does not exist', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.getRecipe('household-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for recipe belonging to different household', async () => {
      // findFirst with householdId filter returns null
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.getRecipe('other-household', 'recipe-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('passes householdId to prisma filter', async () => {
      const recipe = makeRecipe({});
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);

      await service.getRecipe('household-1', 'recipe-1');

      expect(mockPrisma.recipe.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ householdId: 'household-1', id: 'recipe-1' }),
        }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateRecipe
  // ────────────────────────────────────────────────────────────────────────────

  describe('updateRecipe', () => {
    it('updates fields and returns RecipeDetailResponse', async () => {
      const existing = makeRecipe({});
      const updated = makeRecipe({ name: 'Updated', description: 'New desc' });
      mockPrisma.recipe.findFirst.mockResolvedValue(existing);
      mockPrisma.recipe.update.mockResolvedValue(updated);

      const result = await service.updateRecipe('household-1', 'recipe-1', {
        description: 'New desc',
      });

      expect(mockPrisma.recipe.update).toHaveBeenCalled();
      expect(result.id).toBe('recipe-1');
    });

    it('auto-updates slug when name changes', async () => {
      const existing = makeRecipe({ name: 'Old Name', slug: 'old-name' });
      const updated = makeRecipe({ name: 'New Name', slug: 'new-name' });
      // findFirst for existence check, then for uniqueSlug check (no conflict)
      mockPrisma.recipe.findFirst
        .mockResolvedValueOnce(existing) // existence check
        .mockResolvedValueOnce(null); // slug uniqueness
      mockPrisma.recipe.update.mockResolvedValue(updated);

      await service.updateRecipe('household-1', 'recipe-1', { name: 'New Name' });

      expect(mockPrisma.recipe.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'new-name' }),
        }),
      );
    });

    it('does not update slug when name is unchanged', async () => {
      const existing = makeRecipe({ name: 'Test Recipe', slug: 'test-recipe' });
      const updated = makeRecipe({ description: 'Updated' });
      mockPrisma.recipe.findFirst.mockResolvedValue(existing);
      mockPrisma.recipe.update.mockResolvedValue(updated);

      await service.updateRecipe('household-1', 'recipe-1', {
        description: 'Updated',
      });

      const updateCall = mockPrisma.recipe.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('slug');
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRecipe('household-1', 'nonexistent', { description: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // deleteRecipe
  // ────────────────────────────────────────────────────────────────────────────

  describe('deleteRecipe', () => {
    it('deletes recipe successfully', async () => {
      const existing = makeRecipe({});
      mockPrisma.recipe.findFirst.mockResolvedValue(existing);
      mockPrisma.recipe.delete.mockResolvedValue(existing);

      await service.deleteRecipe('household-1', 'recipe-1');

      expect(mockPrisma.recipe.delete).toHaveBeenCalledWith({
        where: { id: 'recipe-1' },
      });
    });

    it('throws NotFoundException for wrong household', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteRecipe('other-household', 'recipe-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when recipe does not exist', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteRecipe('household-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // duplicateRecipe
  // ────────────────────────────────────────────────────────────────────────────

  describe('duplicateRecipe', () => {
    it('creates independent copy with "(copia)" suffix', async () => {
      const section = makeSection({ ingredients: [makeIngredient()] });
      const step = makeStep();
      const original = makeRecipe({ sections: [section], steps: [step] });
      mockPrisma.recipe.findFirst
        .mockResolvedValueOnce(original) // original fetch
        .mockResolvedValueOnce(null); // uniqueSlug check
      mockPrisma.recipe.create.mockResolvedValue({
        id: 'dup-1',
        slug: 'test-recipe-copia',
        name: 'Test Recipe (copia)',
      });

      const result: DuplicateRecipeResponse = await service.duplicateRecipe(
        'household-1',
        'recipe-1',
        'user-1',
      );

      expect(mockPrisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Recipe (copia)',
          }),
        }),
      );
      expect(result.id).toBe('dup-1');
      expect(result.name).toBe('Test Recipe (copia)');
    });

    it('copies sections and ingredients', async () => {
      const ingredient = makeIngredient();
      const section = makeSection({ ingredients: [ingredient] });
      const original = makeRecipe({ sections: [section], steps: [] });
      mockPrisma.recipe.findFirst
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(null);
      mockPrisma.recipe.create.mockResolvedValue({
        id: 'dup-1',
        slug: 'dup',
        name: 'Test Recipe (copia)',
      });

      await service.duplicateRecipe('household-1', 'recipe-1', 'user-1');

      const createCall = mockPrisma.recipe.create.mock.calls[0][0];
      expect(createCall.data.sections.create).toHaveLength(1);
      expect(createCall.data.sections.create[0].ingredients.create).toHaveLength(1);
    });

    it('copies steps', async () => {
      const step = makeStep();
      const original = makeRecipe({ sections: [], steps: [step] });
      mockPrisma.recipe.findFirst
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(null);
      mockPrisma.recipe.create.mockResolvedValue({
        id: 'dup-1',
        slug: 'dup',
        name: 'Test Recipe (copia)',
      });

      await service.duplicateRecipe('household-1', 'recipe-1', 'user-1');

      const createCall = mockPrisma.recipe.create.mock.calls[0][0];
      expect(createCall.data.steps.create).toHaveLength(1);
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.duplicateRecipe('household-1', 'nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
