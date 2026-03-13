import { NotFoundException } from '@nestjs/common';
import { IngredientsService } from '../../src/recipes/ingredients/ingredients.service';
import type { RecipeIngredientResponse } from '@recipe-manager/shared';

const makeIngredient = (overrides = {}): RecipeIngredientResponse => ({
  id: 'ing-1',
  foodId: 'food-1',
  foodName: 'Chicken',
  unitId: 'unit-1',
  unitName: 'gram',
  unitAbbreviation: 'g',
  quantity: 200,
  note: null,
  order: 0,
  ...overrides,
});

const makeRecipe = (overrides = {}) => ({
  id: 'recipe-1',
  householdId: 'household-1',
  ...overrides,
});

const makeSection = (overrides = {}) => ({
  id: 'sec-1',
  recipeId: 'recipe-1',
  title: null,
  order: 0,
  ...overrides,
});

const makePrismaIngredient = (overrides = {}) => ({
  id: 'ing-1',
  foodId: 'food-1',
  food: { name: 'Chicken' },
  unitId: 'unit-1',
  unit: { name: 'gram', abbreviation: 'g' },
  quantity: { toNumber: () => 200 } as { toNumber(): number },
  note: null,
  order: 0,
  ...overrides,
});

describe('IngredientsService', () => {
  let service: IngredientsService;
  let mockPrisma: {
    recipe: { findFirst: jest.Mock };
    ingredientSection: { findFirst: jest.Mock };
    recipeIngredient: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      recipe: {
        findFirst: jest.fn(),
      },
      ingredientSection: {
        findFirst: jest.fn(),
      },
      recipeIngredient: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new IngredientsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // addIngredient
  // ─────────────────────────────────────────────────────────────────────────

  describe('addIngredient', () => {
    it('creates ingredient with order = max + 1', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.recipeIngredient.findMany.mockResolvedValue([
        { order: 0 },
        { order: 1 },
      ]);
      mockPrisma.recipeIngredient.create.mockResolvedValue(
        makePrismaIngredient({ id: 'ing-new', order: 2 }),
      );

      const result: RecipeIngredientResponse = await service.addIngredient(
        'household-1',
        'recipe-1',
        'sec-1',
        { foodId: 'food-1' },
      );

      expect(mockPrisma.recipeIngredient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 2 }),
        }),
      );
      expect(result.id).toBe('ing-new');
    });

    it('creates ingredient with order 0 when section is empty', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.recipeIngredient.findMany.mockResolvedValue([]);
      mockPrisma.recipeIngredient.create.mockResolvedValue(
        makePrismaIngredient({ order: 0 }),
      );

      await service.addIngredient('household-1', 'recipe-1', 'sec-1', {
        foodId: 'food-1',
      });

      expect(mockPrisma.recipeIngredient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 0 }),
        }),
      );
    });

    it('maps food and unit names in the response', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.recipeIngredient.findMany.mockResolvedValue([]);
      mockPrisma.recipeIngredient.create.mockResolvedValue(
        makePrismaIngredient(),
      );

      const result = await service.addIngredient(
        'household-1',
        'recipe-1',
        'sec-1',
        { foodId: 'food-1' },
      );

      expect(result.foodName).toBe('Chicken');
      expect(result.unitName).toBe('gram');
      expect(result.unitAbbreviation).toBe('g');
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.addIngredient('household-1', 'nonexistent', 'sec-1', {
          foodId: 'f1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when section not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(null);

      await expect(
        service.addIngredient('household-1', 'recipe-1', 'missing-sec', {
          foodId: 'f1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // updateIngredient
  // ─────────────────────────────────────────────────────────────────────────

  describe('updateIngredient', () => {
    it('updates ingredient and returns RecipeIngredientResponse', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.recipeIngredient.findFirst.mockResolvedValue(
        makePrismaIngredient(),
      );
      mockPrisma.recipeIngredient.update.mockResolvedValue(
        makePrismaIngredient({ note: 'chopped' }),
      );

      const result = await service.updateIngredient(
        'household-1',
        'recipe-1',
        'sec-1',
        'ing-1',
        { note: 'chopped' },
      );

      expect(mockPrisma.recipeIngredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ing-1' },
          data: { note: 'chopped' },
        }),
      );
      expect(result.note).toBe('chopped');
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.updateIngredient('hh', 'no-recipe', 'sec-1', 'ing-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when section not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(null);

      await expect(
        service.updateIngredient('household-1', 'recipe-1', 'no-sec', 'ing-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when ingredient not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.recipeIngredient.findFirst.mockResolvedValue(null);

      await expect(
        service.updateIngredient('household-1', 'recipe-1', 'sec-1', 'no-ing', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // deleteIngredient
  // ─────────────────────────────────────────────────────────────────────────

  describe('deleteIngredient', () => {
    it('deletes ingredient successfully', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.recipeIngredient.findFirst.mockResolvedValue(
        makePrismaIngredient(),
      );
      mockPrisma.recipeIngredient.delete.mockResolvedValue({});

      await service.deleteIngredient(
        'household-1',
        'recipe-1',
        'sec-1',
        'ing-1',
      );

      expect(mockPrisma.recipeIngredient.delete).toHaveBeenCalledWith({
        where: { id: 'ing-1' },
      });
    });

    it('throws NotFoundException when ingredient not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.recipeIngredient.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteIngredient('household-1', 'recipe-1', 'sec-1', 'no-ing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // reorderIngredients
  // ─────────────────────────────────────────────────────────────────────────

  describe('reorderIngredients', () => {
    it('updates each ingredient order to its index in ids array', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      // $transaction receives an array of Prisma promises (not functions)
      mockPrisma.$transaction.mockImplementation(
        async (promises: Promise<unknown>[]) => Promise.all(promises),
      );
      mockPrisma.recipeIngredient.update.mockResolvedValue({});

      await service.reorderIngredients('household-1', 'recipe-1', 'sec-1', [
        'ing-b',
        'ing-a',
      ]);

      expect(mockPrisma.recipeIngredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'ing-b' }),
          data: { order: 0 },
        }),
      );
      expect(mockPrisma.recipeIngredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'ing-a' }),
          data: { order: 1 },
        }),
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.reorderIngredients('household-1', 'no-recipe', 'sec-1', []),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when section not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(null);

      await expect(
        service.reorderIngredients('household-1', 'recipe-1', 'no-sec', []),
      ).rejects.toThrow(NotFoundException);
    });

    it('scopes transaction updates to the correct sectionId', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(makeSection());
      mockPrisma.$transaction.mockImplementation(
        async (promises: Promise<unknown>[]) => Promise.all(promises),
      );
      mockPrisma.recipeIngredient.update.mockResolvedValue({});

      await service.reorderIngredients('household-1', 'recipe-1', 'sec-1', ['i1', 'i2']);

      const calls = mockPrisma.recipeIngredient.update.mock.calls;
      expect(calls[0][0].where).toMatchObject({ id: 'i1', sectionId: 'sec-1' });
      expect(calls[1][0].where).toMatchObject({ id: 'i2', sectionId: 'sec-1' });
    });
  });
});
