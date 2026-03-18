// apps/api/src/admin/households/admin-households.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { AdminHouseholdsService } from './admin-households.service';

describe('AdminHouseholdsService', () => {
  let service: AdminHouseholdsService;
  let prisma: {
    household: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    user: { deleteMany: jest.Mock };
    recipe: { findMany: jest.Mock; deleteMany: jest.Mock };
    mealPlanEntry: { deleteMany: jest.Mock };
    mealPlan: { deleteMany: jest.Mock };
    recipeIngredient: { deleteMany: jest.Mock };
    ingredientSection: { deleteMany: jest.Mock };
    recipeImage: { deleteMany: jest.Mock };
    instructionStep: { deleteMany: jest.Mock };
    apiToken: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      household: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      user: { deleteMany: jest.fn() },
      recipe: { findMany: jest.fn(), deleteMany: jest.fn() },
      mealPlanEntry: { deleteMany: jest.fn() },
      mealPlan: { deleteMany: jest.fn() },
      recipeIngredient: { deleteMany: jest.fn() },
      ingredientSection: { deleteMany: jest.fn() },
      recipeImage: { deleteMany: jest.fn() },
      instructionStep: { deleteMany: jest.fn() },
      apiToken: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new AdminHouseholdsService(prisma as any);
  });

  it('findAll returns paginated list', async () => {
    prisma.household.findMany.mockResolvedValue([{ id: 'h1', name: 'Home', createdAt: new Date(), updatedAt: new Date(), _count: { users: 2 } }]);
    prisma.household.count.mockResolvedValue(1);
    const result = await service.findAll(1, 20);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('h1');
    expect(result.items[0].memberCount).toBe(2);
  });

  it('findOne throws NotFoundException when not found', async () => {
    prisma.household.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('create returns new household response', async () => {
    prisma.household.create.mockResolvedValue({ id: 'h2', name: 'New', createdAt: new Date(), updatedAt: new Date(), _count: { users: 0 } });
    const result = await service.create({ name: 'New' });
    expect(result.id).toBe('h2');
  });

  it('update returns updated household', async () => {
    prisma.household.findUnique.mockResolvedValue({ id: 'h1' });
    prisma.household.update.mockResolvedValue({ id: 'h1', name: 'Updated', createdAt: new Date(), updatedAt: new Date(), _count: { users: 1 } });
    const result = await service.update('h1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('remove calls $transaction for cascade delete', async () => {
    prisma.household.findUnique.mockResolvedValue({ id: 'h1' });
    prisma.$transaction.mockResolvedValue(undefined);
    await service.remove('h1');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
