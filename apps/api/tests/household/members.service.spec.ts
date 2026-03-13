import { NotFoundException } from '@nestjs/common';
import { MembersService } from '../../src/household/members/members.service';
import type { MemberResponse } from '@recipe-manager/shared';

describe('MembersService', () => {
  let service: MembersService;
  let mockPrisma: {
    user: {
      findMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockMember = {
    id: 'user-2',
    name: 'Bob',
    email: null,
    username: null,
    passwordHash: null,
    gender: null,
    dateOfBirth: null,
    householdId: 'hh-1',
  };

  const expectedMemberResponse: MemberResponse = {
    id: 'user-2',
    name: 'Bob',
    email: null,
    username: null,
    gender: null,
    dateOfBirth: null,
    canLogin: false,
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new MembersService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listMembers', () => {
    it('returns all members of the household', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockMember]);

      const result = await service.listMembers('hh-1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { householdId: 'hh-1' },
      });
      expect(result).toEqual([expectedMemberResponse]);
    });
  });

  describe('createMember', () => {
    it('creates a no-login member with passwordHash null', async () => {
      mockPrisma.user.create.mockResolvedValue(mockMember);

      const result = await service.createMember('hh-1', { name: 'Bob' });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          householdId: 'hh-1',
          name: 'Bob',
          passwordHash: null,
        },
      });
      expect(result).toEqual(expectedMemberResponse);
    });

    it('creates member with optional fields', async () => {
      const memberWithDetails = {
        ...mockMember,
        email: 'bob@example.com',
        username: 'bob',
        gender: 'male',
        dateOfBirth: new Date('2010-03-20'),
      };
      mockPrisma.user.create.mockResolvedValue(memberWithDetails);

      await service.createMember('hh-1', {
        name: 'Bob',
        email: 'bob@example.com',
        username: 'bob',
        gender: 'male' as any,
        dateOfBirth: '2010-03-20',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          householdId: 'hh-1',
          name: 'Bob',
          email: 'bob@example.com',
          username: 'bob',
          gender: 'male',
          dateOfBirth: new Date('2010-03-20'),
          passwordHash: null,
        },
      });
    });
  });

  describe('getMember', () => {
    it('returns member when found in household', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockMember);

      const result = await service.getMember('hh-1', 'user-2');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-2', householdId: 'hh-1' },
      });
      expect(result).toEqual(expectedMemberResponse);
    });

    it('throws NotFoundException when member not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getMember('hh-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when member belongs to different household', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getMember('hh-other', 'user-2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMember', () => {
    it('updates member when found in household', async () => {
      const updatedMember = { ...mockMember, name: 'Bobby' };
      mockPrisma.user.findFirst.mockResolvedValue(mockMember);
      mockPrisma.user.update.mockResolvedValue(updatedMember);

      const result = await service.updateMember('hh-1', 'user-2', { name: 'Bobby' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { name: 'Bobby' },
      });
      expect(result.name).toBe('Bobby');
    });

    it('throws NotFoundException when member not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.updateMember('hh-1', 'nonexistent', { name: 'Bobby' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteMember', () => {
    it('deletes member when found in household', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockMember);
      mockPrisma.user.delete.mockResolvedValue(mockMember);

      await service.deleteMember('hh-1', 'user-2');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-2' },
      });
    });

    it('throws NotFoundException when member not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteMember('hh-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
