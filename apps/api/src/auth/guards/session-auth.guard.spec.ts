import { ExecutionContext } from '@nestjs/common';
import { SessionAuthGuard } from './session-auth.guard';

describe('SessionAuthGuard', () => {
  let guard: SessionAuthGuard;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    guard = new SessionAuthGuard(prisma as any);
  });

  function ctx(session: Record<string, unknown>) {
    const req: any = { session };
    return { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext;
  }

  it('returns false when no userId in session', async () => {
    expect(await guard.canActivate(ctx({}))).toBe(false);
  });

  it('returns false when userId does not resolve to a user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    expect(await guard.canActivate(ctx({ userId: 'u1' }))).toBe(false);
  });

  it('returns true and sets req.user when session is valid', async () => {
    const user = { id: 'u1', name: 'Test', householdId: 'h1' };
    prisma.user.findUnique.mockResolvedValue(user);
    const req: any = { session: { userId: 'u1' } };
    const c = { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext;
    expect(await guard.canActivate(c)).toBe(true);
    expect(req.user).toBe(user);
  });
});
