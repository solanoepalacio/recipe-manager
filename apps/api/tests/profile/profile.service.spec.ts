import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ProfileService } from '../../src/profile/profile.service';
import type { ProfileResponse } from '@recipe-manager/shared';

jest.mock('bcrypt');

describe('ProfileService', () => {
  let service: ProfileService;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    username: 'alice',
    passwordHash: 'hashed-password',
    gender: 'female',
    dateOfBirth: new Date('1990-06-15'),
    householdId: 'hh-1',
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ProfileService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns correct ProfileResponse shape', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual<ProfileResponse>({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        username: 'alice',
        gender: 'female' as any,
        dateOfBirth: '1990-06-15',
        householdId: 'hh-1',
      });
    });

    it('returns null dateOfBirth when user has no dateOfBirth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, dateOfBirth: null });

      const result = await service.getProfile('user-1');

      expect(result.dateOfBirth).toBeNull();
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates name without hashing password', async () => {
      const updatedUser = { ...mockUser, name: 'Alice Updated' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', { name: 'Alice Updated' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Alice Updated' },
      });
      expect(result.name).toBe('Alice Updated');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('hashes password when password is provided', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      const updatedUser = { ...mockUser, passwordHash: 'new-hash' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.updateProfile('user-1', { password: 'newpassword123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hash' },
      });
    });

    it('does not include password field in update data', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      const updatedUser = { ...mockUser, passwordHash: 'new-hash' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await service.updateProfile('user-1', { password: 'newpassword123', name: 'Bob' });

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('password');
      expect(updateCall.data).toHaveProperty('passwordHash', 'new-hash');
      expect(updateCall.data).toHaveProperty('name', 'Bob');
    });
  });
});
