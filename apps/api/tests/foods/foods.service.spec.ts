import { FoodsService } from '../../src/foods/foods.service';
import type { FoodListResponse } from '@recipe-manager/shared';

describe('FoodsService', () => {
  let service: FoodsService;
  let mockPrisma: {
    food: { findMany: jest.Mock; count: jest.Mock };
  };

  const mockFoods = [
    { id: 'food-1', name: 'Chicken' },
    { id: 'food-2', name: 'Broccoli' },
  ];

  beforeEach(() => {
    mockPrisma = {
      food: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new FoodsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listFoods', () => {
    it('returns all foods when no query provided', async () => {
      mockPrisma.food.findMany.mockResolvedValue(mockFoods);
      mockPrisma.food.count.mockResolvedValue(2);

      const result = await service.listFoods();

      expect(mockPrisma.food.findMany).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual<FoodListResponse>({
        items: [
          { id: 'food-1', name: 'Chicken' },
          { id: 'food-2', name: 'Broccoli' },
        ],
        total: 2,
      });
    });

    it('filters foods by name when query provided (case-insensitive)', async () => {
      mockPrisma.food.findMany.mockResolvedValue([mockFoods[0]]);
      mockPrisma.food.count.mockResolvedValue(1);

      const result = await service.listFoods('chick');

      expect(mockPrisma.food.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'chick', mode: 'insensitive' } },
      });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Chicken');
    });

    it('returns empty list when no foods match query', async () => {
      mockPrisma.food.findMany.mockResolvedValue([]);
      mockPrisma.food.count.mockResolvedValue(0);

      const result = await service.listFoods('xyz');

      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});
