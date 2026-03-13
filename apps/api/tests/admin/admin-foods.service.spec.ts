import { NotFoundException } from '@nestjs/common';
import { AdminFoodsService } from '../../src/admin/foods/admin-foods.service';
import type { FoodResponse, PaginatedResponse } from '@recipe-manager/shared';

const mockFood = {
  id: 'food-1',
  name: 'Chicken',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('AdminFoodsService', () => {
  let service: AdminFoodsService;
  let mockPrisma: {
    food: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      food: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new AdminFoodsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listFoods', () => {
    it('returns paginated food list', async () => {
      mockPrisma.food.findMany.mockResolvedValue([mockFood]);
      mockPrisma.food.count.mockResolvedValue(1);

      const result = await service.listFoods(1, 20);

      expect(result).toMatchObject<PaginatedResponse<FoodResponse>>({
        items: [{ id: 'food-1', name: 'Chicken' }],
        total: 1,
        page: 1,
        perPage: 20,
      });
    });

    it('filters by search query', async () => {
      mockPrisma.food.findMany.mockResolvedValue([mockFood]);
      mockPrisma.food.count.mockResolvedValue(1);

      await service.listFoods(1, 20, 'chick');

      expect(mockPrisma.food.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'chick', mode: 'insensitive' } },
        }),
      );
    });

    it('applies correct pagination', async () => {
      mockPrisma.food.findMany.mockResolvedValue([]);
      mockPrisma.food.count.mockResolvedValue(0);

      await service.listFoods(3, 10);

      expect(mockPrisma.food.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('createFood', () => {
    it('creates food and returns FoodResponse', async () => {
      mockPrisma.food.create.mockResolvedValue(mockFood);

      const result = await service.createFood({ name: 'Chicken' });

      expect(result).toEqual<FoodResponse>({ id: 'food-1', name: 'Chicken' });
    });
  });

  describe('updateFood', () => {
    it('updates food and returns FoodResponse', async () => {
      mockPrisma.food.findUnique.mockResolvedValue(mockFood);
      mockPrisma.food.update.mockResolvedValue({ ...mockFood, name: 'Updated Chicken' });

      const result = await service.updateFood('food-1', { name: 'Updated Chicken' });

      expect(result.name).toBe('Updated Chicken');
    });

    it('throws NotFoundException when food not found', async () => {
      mockPrisma.food.findUnique.mockResolvedValue(null);

      await expect(service.updateFood('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFood', () => {
    it('deletes food successfully', async () => {
      mockPrisma.food.findUnique.mockResolvedValue(mockFood);
      mockPrisma.food.delete.mockResolvedValue(mockFood);

      await expect(service.deleteFood('food-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when food not found', async () => {
      mockPrisma.food.findUnique.mockResolvedValue(null);

      await expect(service.deleteFood('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
