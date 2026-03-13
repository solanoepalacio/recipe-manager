import { NotFoundException } from '@nestjs/common';
import { SectionsService } from '../../src/recipes/sections/sections.service';
import type { IngredientSectionResponse } from '@recipe-manager/shared';

const makeSection = (overrides = {}): IngredientSectionResponse => ({
  id: 'sec-1',
  title: null,
  order: 0,
  ingredients: [],
  ...overrides,
});

const makeRecipe = (overrides = {}) => ({
  id: 'recipe-1',
  householdId: 'household-1',
  ...overrides,
});

describe('SectionsService', () => {
  let service: SectionsService;
  let mockPrisma: {
    recipe: { findFirst: jest.Mock };
    ingredientSection: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      recipe: {
        findFirst: jest.fn(),
      },
      ingredientSection: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new SectionsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // addSection
  // ─────────────────────────────────────────────────────────────────────────

  describe('addSection', () => {
    it('creates a section with order = max + 1', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findMany.mockResolvedValue([
        { order: 0 },
        { order: 1 },
      ]);
      mockPrisma.ingredientSection.create.mockResolvedValue({
        id: 'sec-new',
        title: 'Sauce',
        order: 2,
        ingredients: [],
      });

      const result: IngredientSectionResponse = await service.addSection(
        'household-1',
        'recipe-1',
        { title: 'Sauce' },
      );

      expect(mockPrisma.ingredientSection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 2 }),
        }),
      );
      expect(result.id).toBe('sec-new');
      expect(result.title).toBe('Sauce');
    });

    it('creates section with order 0 when no existing sections', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findMany.mockResolvedValue([]);
      mockPrisma.ingredientSection.create.mockResolvedValue({
        id: 'sec-new',
        title: null,
        order: 0,
        ingredients: [],
      });

      await service.addSection('household-1', 'recipe-1', {});

      expect(mockPrisma.ingredientSection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 0 }),
        }),
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.addSection('household-1', 'nonexistent', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for recipe in different household', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.addSection('other-household', 'recipe-1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // updateSection
  // ─────────────────────────────────────────────────────────────────────────

  describe('updateSection', () => {
    it('updates section title and returns IngredientSectionResponse', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue({
        id: 'sec-1',
        title: 'Old',
        order: 0,
        recipeId: 'recipe-1',
        ingredients: [],
      });
      mockPrisma.ingredientSection.update.mockResolvedValue({
        id: 'sec-1',
        title: 'New',
        order: 0,
        ingredients: [],
      });

      const result = await service.updateSection(
        'household-1',
        'recipe-1',
        'sec-1',
        { title: 'New' },
      );

      expect(mockPrisma.ingredientSection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sec-1' },
          data: { title: 'New' },
        }),
      );
      expect(result.title).toBe('New');
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSection('household-1', 'nonexistent', 'sec-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when section not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSection('household-1', 'recipe-1', 'sec-missing', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // deleteSection
  // ─────────────────────────────────────────────────────────────────────────

  describe('deleteSection', () => {
    it('deletes section successfully', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue({
        id: 'sec-1',
        recipeId: 'recipe-1',
        ingredients: [],
      });
      mockPrisma.ingredientSection.delete.mockResolvedValue({});

      await service.deleteSection('household-1', 'recipe-1', 'sec-1');

      expect(mockPrisma.ingredientSection.delete).toHaveBeenCalledWith({
        where: { id: 'sec-1' },
      });
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteSection('household-1', 'recipe-1', 'sec-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when section not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.ingredientSection.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteSection('household-1', 'recipe-1', 'sec-missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // reorderSections
  // ─────────────────────────────────────────────────────────────────────────

  describe('reorderSections', () => {
    it('updates each section order to its index in ids array', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      const updates: jest.Mock[] = [];
      // $transaction receives an array of Prisma promises (not functions)
      mockPrisma.$transaction.mockImplementation(
        async (promises: Promise<unknown>[]) => Promise.all(promises),
      );
      mockPrisma.ingredientSection.update.mockResolvedValue({});

      await service.reorderSections('household-1', 'recipe-1', [
        'sec-b',
        'sec-a',
      ]);

      expect(mockPrisma.ingredientSection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'sec-b' }),
          data: { order: 0 },
        }),
      );
      expect(mockPrisma.ingredientSection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'sec-a' }),
          data: { order: 1 },
        }),
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.reorderSections('household-1', 'nonexistent', ['sec-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('scopes transaction updates to the correct recipeId', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue({ id: 'r1', householdId: 'hh1' });
      mockPrisma.$transaction.mockImplementation(
        async (promises: Promise<unknown>[]) => Promise.all(promises),
      );
      mockPrisma.ingredientSection.update.mockResolvedValue({});

      await service.reorderSections('hh1', 'r1', ['s1', 's2']);

      const calls = mockPrisma.ingredientSection.update.mock.calls;
      expect(calls[0][0].where).toMatchObject({ id: 's1', recipeId: 'r1' });
      expect(calls[1][0].where).toMatchObject({ id: 's2', recipeId: 'r1' });
    });
  });
});
