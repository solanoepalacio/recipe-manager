import { NotFoundException } from '@nestjs/common';
import { AdminTokensService } from '../../src/admin/tokens/admin-tokens.service';
import type { AdminTokenResponse, AdminCreateTokenResponse } from '@recipe-manager/shared';

const mockToken = {
  id: 'token-1',
  name: 'Agent Token',
  tokenHash: 'hashedvalue',
  userId: 'user-1',
  createdById: 'admin-1',
  createdAt: new Date('2024-01-01'),
  lastUsedAt: null,
  user: { id: 'user-1', name: 'Alice' },
};

describe('AdminTokensService', () => {
  let service: AdminTokensService;
  let mockPrisma: {
    apiToken: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      apiToken: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new AdminTokensService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listTokens', () => {
    it('returns token list with metadata only', async () => {
      mockPrisma.apiToken.findMany.mockResolvedValue([mockToken]);

      const result = await service.listTokens();

      expect(result).toHaveLength(1);
      const token = result[0] as AdminTokenResponse;
      expect(token.id).toBe('token-1');
      expect(token.name).toBe('Agent Token');
      expect(token.userId).toBe('user-1');
      expect(token.userName).toBe('Alice');
    });

    it('never returns tokenHash in list response', async () => {
      mockPrisma.apiToken.findMany.mockResolvedValue([mockToken]);

      const result = await service.listTokens();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenObj = result[0] as any;
      expect(tokenObj['tokenHash']).toBeUndefined();
      expect(tokenObj['token']).toBeUndefined();
    });

    it('includes user relation in query', async () => {
      mockPrisma.apiToken.findMany.mockResolvedValue([]);

      await service.listTokens();

      expect(mockPrisma.apiToken.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { user: true } }),
      );
    });
  });

  describe('createToken', () => {
    it('creates token and returns raw token once in response', async () => {
      mockPrisma.apiToken.create.mockResolvedValue(mockToken);

      const result = await service.createToken('admin-1', { name: 'Agent Token', userId: 'user-1' });

      // Raw token must be in response
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.id).toBe('token-1');
      expect(result.name).toBe('Agent Token');
    });

    it('stores hashed token (not raw) in database', async () => {
      mockPrisma.apiToken.create.mockResolvedValue(mockToken);

      const result = await service.createToken('admin-1', { name: 'Agent Token', userId: 'user-1' });

      const callArg = mockPrisma.apiToken.create.mock.calls[0][0];
      const storedHash = callArg.data.tokenHash;

      // The stored hash should not equal the raw token returned
      expect(storedHash).not.toBe(result.token);
      // Hash should be 64 chars (SHA-256 hex)
      expect(storedHash).toHaveLength(64);
    });

    it('create response matches AdminCreateTokenResponse shape', async () => {
      mockPrisma.apiToken.create.mockResolvedValue(mockToken);

      const result: AdminCreateTokenResponse = await service.createToken('admin-1', {
        name: 'Agent Token',
        userId: 'user-1',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('token');
      // Should NOT have tokenHash
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any)['tokenHash']).toBeUndefined();
    });
  });

  describe('deleteToken', () => {
    it('deletes token successfully', async () => {
      mockPrisma.apiToken.findUnique.mockResolvedValue(mockToken);
      mockPrisma.apiToken.delete.mockResolvedValue(mockToken);

      await expect(service.deleteToken('token-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when token not found', async () => {
      mockPrisma.apiToken.findUnique.mockResolvedValue(null);

      await expect(service.deleteToken('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
