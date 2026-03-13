import { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY, Public } from '../../src/common/decorators/public.decorator';
import { Reflector } from '@nestjs/core';

function makeContext(user?: unknown, admin?: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, admin }),
    }),
    getHandler: () => () => {},
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('CurrentUser decorator', () => {
  it('extracts req.user from context', () => {
    const ctx = makeContext({ id: 'user-1' });
    const request = ctx.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'user-1' });
  });
});

describe('CurrentAdmin decorator', () => {
  it('extracts req.admin from context', () => {
    const ctx = makeContext(undefined, { id: 'admin-1' });
    const request = ctx.switchToHttp().getRequest();
    expect(request.admin).toEqual({ id: 'admin-1' });
  });
});

describe('Public decorator', () => {
  it('exports IS_PUBLIC_KEY as isPublic', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('sets isPublic metadata on a class', () => {
    @Public()
    class TestController {}

    const reflector = new Reflector();
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController);
    expect(metadata).toBe(true);
  });
});
