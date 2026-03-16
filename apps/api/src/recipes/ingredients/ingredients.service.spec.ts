// apps/api/src/recipes/ingredients/ingredients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsService } from './ingredients.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  recipe: { findUnique: jest.fn() },
  ingredientSection: { findUnique: jest.fn() },
  recipeIngredient: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
};

describe('IngredientsService', () => {
  let service: IngredientsService;

  beforeEach(async () => {
    jest.clearAllMocks();
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
});
