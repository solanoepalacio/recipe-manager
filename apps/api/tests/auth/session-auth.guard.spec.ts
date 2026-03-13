import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../../src/auth/guards/session-auth.guard';

function makeContext(options: {
  isPublic?: boolean;
  sessionUserId?: string;
}): ExecutionContext {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(options.isPublic ?? false) };
  const ctx = {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({
        session: options.sessionUserId ? { userId: options.sessionUserId } : {},
      }),
    }),
  } as unknown as ExecutionContext;
  return ctx;
}

describe('SessionAuthGuard', () => {
  let guard: SessionAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    guard = new SessionAuthGuard(reflector);
  });

  it('returns true when endpoint is marked @Public()', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const ctx = {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ session: {} }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when session has a userId', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ session: { userId: 'user-123' } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when session has no userId', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ session: {} }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('returns false when there is no session at all', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(false);
  });
});
