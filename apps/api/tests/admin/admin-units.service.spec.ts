import { NotFoundException } from '@nestjs/common';
import { AdminUnitsService } from '../../src/admin/units/admin-units.service';
import type { UnitResponse, PaginatedResponse } from '@recipe-manager/shared';

const mockUnit = {
  id: 'unit-1',
  name: 'cup',
  abbreviation: 'c',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('AdminUnitsService', () => {
  let service: AdminUnitsService;
  let mockPrisma: {
    unit: {
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
      unit: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new AdminUnitsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUnits', () => {
    it('returns paginated unit list', async () => {
      mockPrisma.unit.findMany.mockResolvedValue([mockUnit]);
      mockPrisma.unit.count.mockResolvedValue(1);

      const result = await service.listUnits(1, 20);

      expect(result).toMatchObject<PaginatedResponse<UnitResponse>>({
        items: [{ id: 'unit-1', name: 'cup', abbreviation: 'c' }],
        total: 1,
        page: 1,
        perPage: 20,
      });
    });

    it('filters by search query', async () => {
      mockPrisma.unit.findMany.mockResolvedValue([mockUnit]);
      mockPrisma.unit.count.mockResolvedValue(1);

      await service.listUnits(1, 20, 'cup');

      expect(mockPrisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'cup', mode: 'insensitive' } },
              { abbreviation: { contains: 'cup', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('applies correct pagination', async () => {
      mockPrisma.unit.findMany.mockResolvedValue([]);
      mockPrisma.unit.count.mockResolvedValue(0);

      await service.listUnits(2, 5);

      expect(mockPrisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('createUnit', () => {
    it('creates unit and returns UnitResponse', async () => {
      mockPrisma.unit.create.mockResolvedValue(mockUnit);

      const result = await service.createUnit({ name: 'cup', abbreviation: 'c' });

      expect(result).toEqual<UnitResponse>({ id: 'unit-1', name: 'cup', abbreviation: 'c' });
    });
  });

  describe('updateUnit', () => {
    it('updates unit and returns UnitResponse', async () => {
      mockPrisma.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrisma.unit.update.mockResolvedValue({ ...mockUnit, name: 'cups' });

      const result = await service.updateUnit('unit-1', { name: 'cups' });

      expect(result.name).toBe('cups');
    });

    it('throws NotFoundException when unit not found', async () => {
      mockPrisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.updateUnit('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUnit', () => {
    it('deletes unit successfully', async () => {
      mockPrisma.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrisma.unit.delete.mockResolvedValue(mockUnit);

      await expect(service.deleteUnit('unit-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when unit not found', async () => {
      mockPrisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.deleteUnit('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
