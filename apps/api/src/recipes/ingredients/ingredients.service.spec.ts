// apps/api/src/recipes/ingredients/ingredients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchCreateIngredientsDto } from './dto/batch-create-ingredient.dto';

const mockPrisma = {
  recipe: { findUnique: jest.fn() },
  ingredientSection: { findUnique: jest.fn() },
  recipeIngredient: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('IngredientsService', () => {
  let service: IngredientsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    (mockPrisma as any).$transaction = jest.fn().mockImplementation((fn: any) => fn(mockPrisma));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<IngredientsService>(IngredientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reorder', () => {
    it('updates order field for each ingredient id by array index', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1', sections: [], steps: [], images: [], createdAt: new Date(), updatedAt: new Date() });
      mockPrisma.recipeIngredient.update.mockResolvedValue({});
      await service.reorder('r1', 'hh1', ['i2', 'i1']);
      expect(mockPrisma.recipeIngredient.update).toHaveBeenCalledWith({ where: { id: 'i2' }, data: { order: 0 } });
      expect(mockPrisma.recipeIngredient.update).toHaveBeenCalledWith({ where: { id: 'i1' }, data: { order: 1 } });
    });
  });

  describe('batchCreate', () => {
    const baseRecipe = { id: 'r1', householdId: 'hh1' };
    const baseSection = { id: 's1', recipeId: 'r1', title: null, order: 0 };

    it('returns SectionResponse without calling createMany when ingredients array is empty', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      mockPrisma.ingredientSection.findUnique.mockResolvedValueOnce({
        ...baseSection,
        ingredients: [],
      });

      const dto = new BatchCreateIngredientsDto();
      dto.ingredients = [];

      const result = await service.batchCreate('r1', 'hh1', 's1', dto);

      expect(mockPrisma.recipeIngredient.createMany).not.toHaveBeenCalled();
      expect(result).toMatchObject({ id: 's1', title: null, order: 0, ingredients: [] });
    });

    it('assigns order 0 and 1 for 2 ingredients on empty section, returns hydrated SectionResponse', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      mockPrisma.ingredientSection.findUnique.mockResolvedValueOnce(baseSection);
      mockPrisma.recipeIngredient.aggregate.mockResolvedValueOnce({ _max: { order: null } });
      mockPrisma.recipeIngredient.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.ingredientSection.findUnique.mockResolvedValueOnce({
        ...baseSection,
        ingredients: [
          { id: 'i1', foodId: 'f1', food: { name: 'Tomate' }, unitId: 'u1', unit: { name: 'gramo' }, quantity: { toNumber: () => 200 }, note: null, order: 0 },
          { id: 'i2', foodId: 'f2', food: { name: 'Cebolla' }, unitId: null, unit: null, quantity: null, note: null, order: 1 },
        ],
      });

      const dto = new BatchCreateIngredientsDto();
      dto.ingredients = [
        { foodId: 'f1', unitId: 'u1', quantity: 200, note: undefined },
        { foodId: 'f2', unitId: undefined, quantity: undefined, note: undefined },
      ];

      const result = await service.batchCreate('r1', 'hh1', 's1', dto);

      expect(mockPrisma.recipeIngredient.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ foodId: 'f1', order: 0 }),
          expect.objectContaining({ foodId: 'f2', order: 1 }),
        ]),
      });
      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0]).toMatchObject({ foodName: 'Tomate', unitName: 'gramo', order: 0 });
      expect(result.ingredients[1]).toMatchObject({ foodName: 'Cebolla', unitName: null, order: 1 });
    });

    it('assigns order 3 and 4 when section already has max order 2', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      mockPrisma.ingredientSection.findUnique.mockResolvedValueOnce(baseSection);
      mockPrisma.recipeIngredient.aggregate.mockResolvedValueOnce({ _max: { order: 2 } });
      mockPrisma.recipeIngredient.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.ingredientSection.findUnique.mockResolvedValueOnce({
        ...baseSection,
        ingredients: [
          { id: 'i3', foodId: 'f1', food: { name: 'Tomate' }, unitId: null, unit: null, quantity: null, note: null, order: 3 },
          { id: 'i4', foodId: 'f2', food: { name: 'Cebolla' }, unitId: null, unit: null, quantity: null, note: null, order: 4 },
        ],
      });

      const dto = new BatchCreateIngredientsDto();
      dto.ingredients = [
        { foodId: 'f1' },
        { foodId: 'f2' },
      ];

      await service.batchCreate('r1', 'hh1', 's1', dto);

      expect(mockPrisma.recipeIngredient.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ foodId: 'f1', order: 3 }),
          expect.objectContaining({ foodId: 'f2', order: 4 }),
        ]),
      });
    });

    it('throws NotFoundException when section not found or wrong recipeId', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      // First call for section validation inside transaction returns null
      mockPrisma.ingredientSection.findUnique.mockResolvedValueOnce(null);

      const dto = new BatchCreateIngredientsDto();
      dto.ingredients = [{ foodId: 'f1' }];

      await expect(service.batchCreate('r1', 'hh1', 's999', dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when recipe not found (verifyRecipeOwnership)', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(null);

      const dto = new BatchCreateIngredientsDto();
      dto.ingredients = [{ foodId: 'f1' }];

      await expect(service.batchCreate('r1', 'hh1', 's1', dto)).rejects.toThrow(NotFoundException);
    });
  });
});
