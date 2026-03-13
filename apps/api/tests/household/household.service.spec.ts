import { NotFoundException } from '@nestjs/common';
import { HouseholdService } from '../../src/household/household.service';
import type { HouseholdResponse } from '@recipe-manager/shared';

describe('HouseholdService', () => {
  let service: HouseholdService;
  let mockPrisma: {
    household: { findUnique: jest.Mock };
  };

  const mockMembers = [
    {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: 'hashed',
      gender: 'female',
      dateOfBirth: new Date('1990-06-15'),
    },
    {
      id: 'user-2',
      name: 'Bob',
      email: null,
      username: null,
      passwordHash: null,
      gender: null,
      dateOfBirth: null,
    },
  ];

  const mockHousehold = {
    id: 'hh-1',
    name: 'Smith Family',
    users: mockMembers,
  };

  beforeEach(() => {
    mockPrisma = {
      household: { findUnique: jest.fn() },
    };
    service = new HouseholdService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHousehold', () => {
    it('returns HouseholdResponse with mapped members', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(mockHousehold);

      const result = await service.getHousehold('hh-1');

      expect(result).toEqual<HouseholdResponse>({
        id: 'hh-1',
        name: 'Smith Family',
        members: [
          {
            id: 'user-1',
            name: 'Alice',
            email: 'alice@example.com',
            username: 'alice',
            gender: 'female' as any,
            dateOfBirth: '1990-06-15',
            canLogin: true,
          },
          {
            id: 'user-2',
            name: 'Bob',
            email: null,
            username: null,
            gender: null,
            dateOfBirth: null,
            canLogin: false,
          },
        ],
      });
    });

    it('sets canLogin to true when user has passwordHash', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(mockHousehold);

      const result = await service.getHousehold('hh-1');

      expect(result.members[0].canLogin).toBe(true);
      expect(result.members[1].canLogin).toBe(false);
    });

    it('throws NotFoundException when household not found', async () => {
      mockPrisma.household.findUnique.mockResolvedValue(null);

      await expect(service.getHousehold('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
