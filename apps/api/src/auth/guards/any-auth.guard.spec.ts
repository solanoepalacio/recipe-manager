import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AnyAuthGuard } from './any-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('AnyAuthGuard', () => {
  let guard: AnyAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let sessionGuard: { canActivate: jest.Mock };
  let apiKeyGuard: { canActivate: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    sessionGuard = { canActivate: jest.fn().mockResolvedValue(false) };
    apiKeyGuard = { canActivate: jest.fn().mockResolvedValue(false) };
    guard = new AnyAuthGuard(reflector as any, sessionGuard as any, apiKeyGuard as any);
  });

  const ctx = {} as ExecutionContext;

  it('returns true immediately when route is @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(sessionGuard.canActivate).not.toHaveBeenCalled();
    expect(apiKeyGuard.canActivate).not.toHaveBeenCalled();
  });

  it('returns true and does NOT call apiKeyGuard when session passes', async () => {
    sessionGuard.canActivate.mockResolvedValue(true);
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(apiKeyGuard.canActivate).not.toHaveBeenCalled();
  });

  it('falls back to apiKeyGuard when session fails', async () => {
    sessionGuard.canActivate.mockResolvedValue(false);
    apiKeyGuard.canActivate.mockResolvedValue(true);
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when both guards fail', async () => {
    expect(await guard.canActivate(ctx)).toBe(false);
  });
});
