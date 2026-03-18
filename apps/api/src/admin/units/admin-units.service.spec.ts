// apps/api/src/admin/units/admin-units.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { AdminUnitsService } from './admin-units.service';

describe('AdminUnitsService', () => {
  let service: AdminUnitsService;
  let prisma: {
    unit: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = { unit: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } };
    service = new AdminUnitsService(prisma as any);
  });

  it('findAll returns paginated list', async () => {
    prisma.unit.findMany.mockResolvedValue([{ id: 'u1', name: 'cup', abbreviation: 'c', createdAt: new Date(), updatedAt: new Date() }]);
    prisma.unit.count.mockResolvedValue(1);
    const result = await service.findAll(1, 20);
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('cup');
  });

  it('create returns new unit', async () => {
    prisma.unit.create.mockResolvedValue({ id: 'u2', name: 'tbsp', abbreviation: 'T', createdAt: new Date(), updatedAt: new Date() });
    const result = await service.create({ name: 'tbsp', abbreviation: 'T' });
    expect(result.name).toBe('tbsp');
  });

  it('update throws NotFoundException when unit not found', async () => {
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('remove throws NotFoundException when unit not found', async () => {
    prisma.unit.findUnique.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
