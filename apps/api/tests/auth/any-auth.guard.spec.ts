import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AnyAuthGuard } from '../../src/auth/guards/any-auth.guard';

function makeExecutionContext(options: {
  isPublic?: boolean;
  sessionUserId?: string;
  authHeader?: string;
  request?: Record<string, unknown>;
}): ExecutionContext {
  const req: Record<string, unknown> = {
    session: options.sessionUserId ? { userId: options.sessionUserId } : {},
    headers: options.authHeader ? { authorization: options.authHeader } : {},
    ...(options.request ?? {}),
  };

  return {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('AnyAuthGuard', () => {
  let guard: AnyAuthGuard;
  let reflector: Reflector;
  let mockPrisma: {
    user: { findUnique: jest.Mock };
    apiToken: { findUnique: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    mockPrisma = {
      user: { findUnique: jest.fn() },
      apiToken: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    };

    guard = new AnyAuthGuard(reflector, mockPrisma as any);
  });

  it('returns true when endpoint is @Public()', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const ctx = makeExecutionContext({ isPublic: true });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('returns true and sets req.user when session has valid userId', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const user = { id: 'user-1', name: 'Alice', householdId: 'hh-1' };
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const ctx = makeExecutionContext({ sessionUserId: 'user-1' });
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.user).toEqual(user);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('falls through to API key when session userId not in DB', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    // User not found in DB
    mockPrisma.user.findUnique.mockResolvedValue(null);
    // No API key either
    mockPrisma.apiToken.findUnique.mockResolvedValue(null);

    const ctx = makeExecutionContext({ sessionUserId: 'ghost-user' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns true and sets req.user when Bearer token is valid', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const user = { id: 'user-2', name: 'Agent', householdId: 'hh-1' };
    const apiToken = { id: 'token-1', user };
    mockPrisma.apiToken.findUnique.mockResolvedValue(apiToken);
    mockPrisma.user.findUnique.mockResolvedValue(null); // no session

    const ctx = makeExecutionContext({ authHeader: 'Bearer my-raw-token' });
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.user).toEqual(user);
    expect(mockPrisma.apiToken.findUnique).toHaveBeenCalled();
  });

  it('updates lastUsedAt after successful API key auth (non-blocking)', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const user = { id: 'user-2', name: 'Agent', householdId: 'hh-1' };
    const apiToken = { id: 'token-1', user };
    mockPrisma.apiToken.findUnique.mockResolvedValue(apiToken);

    const ctx = makeExecutionContext({ authHeader: 'Bearer my-raw-token' });
    await guard.canActivate(ctx);

    // Give the non-blocking update time to run
    await Promise.resolve();
    expect(mockPrisma.apiToken.update).toHaveBeenCalledWith({
      where: { id: 'token-1' },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it('throws UnauthorizedException when no session and no valid API key', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockPrisma.apiToken.findUnique.mockResolvedValue(null);

    const ctx = makeExecutionContext({});

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when Bearer prefix is missing', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockPrisma.apiToken.findUnique.mockResolvedValue(null);

    const ctx = makeExecutionContext({ authHeader: 'Basic credentials' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
