import { ExecutionContext } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let prisma: { admin: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { admin: { findUnique: jest.fn() } };
    guard = new AdminAuthGuard(prisma as any);
  });

  function ctx(session: Record<string, unknown>) {
    const req: any = { session };
    return { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext;
  }

  it('returns false when no adminId in session', async () => {
    expect(await guard.canActivate(ctx({}))).toBe(false);
  });

  it('returns false when adminId does not resolve', async () => {
    prisma.admin.findUnique.mockResolvedValue(null);
    expect(await guard.canActivate(ctx({ adminId: 'a1' }))).toBe(false);
  });

  it('returns true and sets req.admin when adminId is valid', async () => {
    const admin = { id: 'a1', email: 'admin@example.com' };
    prisma.admin.findUnique.mockResolvedValue(admin);
    const req: any = { session: { adminId: 'a1' } };
    const c = { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext;
    expect(await guard.canActivate(c)).toBe(true);
    expect(req.admin).toBe(admin);
  });
});
