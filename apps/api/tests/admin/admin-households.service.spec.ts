import { NotFoundException } from '@nestjs/common';
import { AdminHouseholdsService } from '../../src/admin/households/admin-households.service';
import type { AdminHouseholdResponse, PaginatedResponse } from '@recipe-manager/shared';

const mockHousehold = {
  id: 'hh-1',
  name: 'Smith Family',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  users: [
    {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: 'hashed',
      gender: 'female',
      dateOfBirth: new Date('1990-05-15'),
    },
  ],
};

describe('AdminHouseholdsService', () => {
  let service: AdminHouseholdsService;
  let mockPrisma: {
    household: {
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
      household: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new AdminHouseholdsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listHouseholds', () => {
    it('returns paginated household list', async () => {
      mockPrisma.household.findMany.mockResolvedValue([mockHousehold]);
      mockPrisma.household.count.mockResolvedValue(1);

      const result = await service.listHouseholds(1, 20);

      expect(result).toMatchObject<PaginatedResponse<AdminHouseholdResponse>>({
        items: [
          expect.objectContaining({
            id: 'hh-1',
            name: 'Smith Family',
            memberCount: 1,
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      });
    });

    it('applies correct skip/take for pagination', async () => {
      mockPrisma.household.findMany.mockResolvedValue([]);
      mockPrisma.household.count.mockResolvedValue(0);

      await service.listHouseholds(2, 10);

      expect(mockPrisma.household.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('getHousehold', () => {
    it('returns household with members', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(mockHousehold);

      const result = await service.getHousehold('hh-1');

      expect(result.id).toBe('hh-1');
      expect(result.members).toHaveLength(1);
      expect(result.members[0].name).toBe('Alice');
      expect(result.memberCount).toBe(1);
    });

    it('throws NotFoundException when household not found', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(null);

      await expect(service.getHousehold('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createHousehold', () => {
    it('creates household and returns response', async () => {
      const dto = { name: 'Jones Family' };
      mockPrisma.household.create.mockResolvedValue({
        ...mockHousehold,
        name: 'Jones Family',
        users: [],
      });

      const result = await service.createHousehold(dto);

      expect(result.name).toBe('Jones Family');
      expect(mockPrisma.household.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Jones Family' },
        }),
      );
    });
  });

  describe('updateHousehold', () => {
    it('updates household and returns response', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(mockHousehold);
      mockPrisma.household.update.mockResolvedValue({
        ...mockHousehold,
        name: 'Updated Family',
      });

      const result = await service.updateHousehold('hh-1', { name: 'Updated Family' });

      expect(result.name).toBe('Updated Family');
    });

    it('throws NotFoundException when household not found', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(null);

      await expect(service.updateHousehold('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteHousehold', () => {
    it('deletes household successfully', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(mockHousehold);
      mockPrisma.household.delete.mockResolvedValue(mockHousehold);

      await expect(service.deleteHousehold('hh-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when household not found', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(null);

      await expect(service.deleteHousehold('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
