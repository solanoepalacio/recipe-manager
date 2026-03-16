import { ExecutionContext } from '@nestjs/common';
import { createHash } from 'crypto';
import { ApiKeyAuthGuard } from './api-key.guard';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  let prisma: { apiToken: { findFirst: jest.Mock; update: jest.Mock } };

  beforeEach(() => {
    prisma = { apiToken: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue(null) } };
    guard = new ApiKeyAuthGuard(prisma as any);
  });

  function ctx(headers: Record<string, string>) {
    const req: any = { headers };
    return { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext;
  }

  it('returns false when Authorization header is absent', async () => {
    expect(await guard.canActivate(ctx({}))).toBe(false);
  });

  it('returns false when Authorization does not start with Bearer', async () => {
    expect(await guard.canActivate(ctx({ authorization: 'Basic abc123' }))).toBe(false);
  });

  it('returns false when token hash does not match', async () => {
    prisma.apiToken.findFirst.mockResolvedValue(null);
    expect(await guard.canActivate(ctx({ authorization: 'Bearer invalid' }))).toBe(false);
  });

  it('returns true, sets req.user, and fires lastUsedAt update when token is valid', async () => {
    const rawToken = 'test-token-abc';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const user = { id: 'u1', householdId: 'h1' };
    const apiToken = { id: 'tok1', tokenHash, user };
    prisma.apiToken.findFirst.mockResolvedValue(apiToken);
    const req: any = { headers: { authorization: `Bearer ${rawToken}` } };
    const c = { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext;
    expect(await guard.canActivate(c)).toBe(true);
    expect(req.user).toBe(user);
    expect(prisma.apiToken.update).toHaveBeenCalledWith({
      where: { id: 'tok1' },
      data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
    });
  });
});
