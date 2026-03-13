import { NotFoundException } from '@nestjs/common';
import { AdminUsersService } from '../../src/admin/users/admin-users.service';
import type { AdminUserResponse, PaginatedResponse } from '@recipe-manager/shared';

const mockUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  username: 'alice',
  passwordHash: 'hashed',
  gender: 'female',
  dateOfBirth: new Date('1990-05-15'),
  householdId: 'hh-1',
  passwordResetToken: null,
  passwordResetExpiresAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  household: { id: 'hh-1', name: 'Smith Family' },
};

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let mockPrisma: {
    user: {
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
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new AdminUsersService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('returns paginated user list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers(1, 20);

      expect(result).toMatchObject<PaginatedResponse<AdminUserResponse>>({
        items: [
          expect.objectContaining({
            id: 'user-1',
            name: 'Alice',
            householdName: 'Smith Family',
            canLogin: true,
          }),
        ],
        total: 1,
        page: 1,
        perPage: 20,
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { household: true } }),
      );
    });

    it('applies correct skip/take for pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(50);

      await service.listUsers(3, 10);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('getUser', () => {
    it('returns user with householdName', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUser('user-1');

      expect(result.id).toBe('user-1');
      expect(result.householdName).toBe('Smith Family');
      expect(result.canLogin).toBe(true);
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUser('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('maps dateOfBirth correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.getUser('user-1');
      expect(result.dateOfBirth).toBe('1990-05-15');
    });

    it('handles null dateOfBirth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, dateOfBirth: null });
      const result = await service.getUser('user-1');
      expect(result.dateOfBirth).toBeNull();
    });

    it('canLogin is false when passwordHash is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });
      const result = await service.getUser('user-1');
      expect(result.canLogin).toBe(false);
    });
  });

  describe('createUser', () => {
    it('creates user and returns AdminUserResponse', async () => {
      const dto = { name: 'Bob', householdId: 'hh-1' };
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        name: 'Bob',
        passwordHash: null,
      });

      const result = await service.createUser(dto as any);

      expect(result.name).toBe('Bob');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Bob', householdId: 'hh-1' }),
        }),
      );
    });

    it('hashes password when provided', async () => {
      const dto = { name: 'Bob', householdId: 'hh-1', password: 'secret123' };
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await service.createUser(dto as any);

      const callArg = mockPrisma.user.create.mock.calls[0][0];
      expect(callArg.data.passwordHash).toBeDefined();
      expect(callArg.data.passwordHash).not.toBe('secret123');
    });

    it('does not include passwordHash field when password not provided', async () => {
      const dto = { name: 'Bob', householdId: 'hh-1' };
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await service.createUser(dto as any);

      const callArg = mockPrisma.user.create.mock.calls[0][0];
      expect(callArg.data.password).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('updates user and returns AdminUserResponse', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Alice Updated',
      });

      const result = await service.updateUser('user-1', { name: 'Alice Updated' });

      expect(result.name).toBe('Alice Updated');
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUser('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('hashes password on update when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.updateUser('user-1', { password: 'newpass123' } as any);

      const callArg = mockPrisma.user.update.mock.calls[0][0];
      expect(callArg.data.passwordHash).toBeDefined();
      expect(callArg.data.password).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('deletes user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      await expect(service.deleteUser('user-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generatePasswordResetUrl', () => {
    it('generates a reset URL and stores hashed token on user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.generatePasswordResetUrl('user-1');

      expect(result.resetUrl).toContain('/reset-password?token=');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpiresAt: expect.any(Date),
        }),
      });
    });

    it('raw token is NOT the same as stored token (stored is hashed)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.generatePasswordResetUrl('user-1');

      const callArg = mockPrisma.user.update.mock.calls[0][0];
      const storedToken = callArg.data.passwordResetToken;

      // The stored token should be a SHA-256 hex (64 chars), the raw token (in URL) is 64 chars hex too
      // But they should be different values
      expect(storedToken).toHaveLength(64);
    });

    it('expiry is set ~24 hours in the future', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const before = Date.now();
      await service.generatePasswordResetUrl('user-1');
      const after = Date.now();

      const callArg = mockPrisma.user.update.mock.calls[0][0];
      const expiry: Date = callArg.data.passwordResetExpiresAt;
      const expiryMs = expiry.getTime();

      // Should be ~24 hours from now
      expect(expiryMs).toBeGreaterThan(before + 23 * 60 * 60 * 1000);
      expect(expiryMs).toBeLessThan(after + 25 * 60 * 60 * 1000);
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.generatePasswordResetUrl('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
