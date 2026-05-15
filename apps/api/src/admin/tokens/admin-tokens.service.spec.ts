// apps/api/src/admin/tokens/admin-tokens.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AdminTokensService } from './admin-tokens.service';

describe('AdminTokensService', () => {
  let service: AdminTokensService;
  let prisma: {
    apiToken: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      apiToken: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    service = new AdminTokensService(prisma as any);
  });

  it('findAll returns paginated token list without tokenHash', async () => {
    prisma.apiToken.findMany.mockResolvedValue([{ id: 't1', name: 'Agent', userId: 'u1', createdById: 'a1', tokenHash: 'secret-hash', createdAt: new Date(), lastUsedAt: null }]);
    prisma.apiToken.count.mockResolvedValue(1);
    const result = await service.findAll(1, 20);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('t1');
    expect((result.items[0] as any).tokenHash).toBeUndefined();
  });

  it('create stores SHA-256 hash and returns raw token once', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', userType: 'agent' });
    prisma.apiToken.create.mockImplementation(async ({ data }) => ({
      id: 't2', name: data.name, userId: data.userId, createdById: data.createdById,
      tokenHash: data.tokenHash, createdAt: new Date(), lastUsedAt: null,
    }));
    const result = await service.create({ name: 'Agent Token', userId: 'u1' }, 'admin-id-1');
    // raw token must be 64 hex chars
    expect(result.token).toHaveLength(64);
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    // stored hash must be SHA-256 of the raw token
    const expectedHash = createHash('sha256').update(result.token).digest('hex');
    const createCall = prisma.apiToken.create.mock.calls[0][0];
    expect(createCall.data.tokenHash).toBe(expectedHash);
    // raw token NOT in response from list endpoint simulation
    expect((result as any).tokenHash).toBeUndefined();
  });

  it('remove throws NotFoundException when token not found', async () => {
    prisma.apiToken.findUnique.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });

  it('remove deletes token when found', async () => {
    prisma.apiToken.findUnique.mockResolvedValue({ id: 't1' });
    prisma.apiToken.delete.mockResolvedValue({ id: 't1' });
    await service.remove('t1');
    expect(prisma.apiToken.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });
});
