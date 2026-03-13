import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from '../../src/auth/guards/admin-auth.guard';

function makeExecutionContext(options: {
  sessionAdminId?: string;
}): ExecutionContext {
  const req: Record<string, unknown> = {
    session: options.sessionAdminId ? { adminId: options.sessionAdminId } : {},
  };

  return {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

function makeContext(options: { session: Record<string, unknown> }): ExecutionContext {
  const req: Record<string, unknown> = { session: options.session };

  return {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let mockPrisma: {
    admin: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      admin: { findUnique: jest.fn() },
    };

    guard = new AdminAuthGuard(mockPrisma as any);
  });

  it('returns true and sets req.admin when session has valid adminId', async () => {
    const admin = { id: 'admin-1', name: 'Admin', email: 'admin@example.com' };
    mockPrisma.admin.findUnique.mockResolvedValue(admin);

    const ctx = makeExecutionContext({ sessionAdminId: 'admin-1' });
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.admin).toEqual(admin);
    expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({ where: { id: 'admin-1' } });
  });

  it('throws UnauthorizedException when no adminId in session', async () => {
    const ctx = makeExecutionContext({});

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockPrisma.admin.findUnique).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when adminId not found in DB', async () => {
    mockPrisma.admin.findUnique.mockResolvedValue(null);

    const ctx = makeExecutionContext({ sessionAdminId: 'nonexistent-admin' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when session has userId but no adminId (user session)', async () => {
    const ctx = makeContext({ session: { userId: 'some-user-id' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
