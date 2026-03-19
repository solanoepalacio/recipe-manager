// apps/api/src/auth/auth.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findFirst: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    prisma = { user: { findFirst: vi.fn() } };
    service = new AuthService(prisma as any);
  });

  it('returns null when no user found by email', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    expect(await service.validateUser('x@x.com', 'pw')).toBeNull();
  });

  it('returns null when user has no passwordHash', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash: null });
    expect(await service.validateUser('x@x.com', 'pw')).toBeNull();
  });

  it('returns null when password does not match', async () => {
    const hash = await bcrypt.hash('correct', 10);
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', passwordHash: hash });
    expect(await service.validateUser('x@x.com', 'wrong')).toBeNull();
  });

  it('returns user when credentials are valid', async () => {
    const hash = await bcrypt.hash('secret', 10);
    const user = { id: 'u1', email: 'x@x.com', passwordHash: hash };
    prisma.user.findFirst.mockResolvedValue(user);
    expect(await service.validateUser('x@x.com', 'secret')).toBe(user);
  });

  it('queries by email', async () => {
    const hash = await bcrypt.hash('pw', 10);
    const user = { id: 'u1', email: 'x@x.com', passwordHash: hash };
    prisma.user.findFirst.mockResolvedValue(user);
    await service.validateUser('x@x.com', 'pw');
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'x@x.com' } }),
    );
  });
});
