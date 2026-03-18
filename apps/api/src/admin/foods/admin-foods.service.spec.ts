// apps/api/src/admin/foods/admin-foods.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { AdminFoodsService } from './admin-foods.service';

describe('AdminFoodsService', () => {
  let service: AdminFoodsService;
  let prisma: {
    food: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = { food: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } };
    service = new AdminFoodsService(prisma as any);
  });

  it('findAll returns paginated list', async () => {
    prisma.food.findMany.mockResolvedValue([{ id: 'f1', name: 'Tomato', createdAt: new Date(), updatedAt: new Date() }]);
    prisma.food.count.mockResolvedValue(1);
    const result = await service.findAll(1, 20);
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Tomato');
  });

  it('create returns new food', async () => {
    prisma.food.create.mockResolvedValue({ id: 'f2', name: 'Garlic', createdAt: new Date(), updatedAt: new Date() });
    const result = await service.create({ name: 'Garlic' });
    expect(result.name).toBe('Garlic');
  });

  it('update throws NotFoundException when food not found', async () => {
    prisma.food.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('remove throws NotFoundException when food not found', async () => {
    prisma.food.findUnique.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
