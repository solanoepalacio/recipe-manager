import { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from '../../src/common/decorators/current-user.decorator';
import { currentAdminFactory } from '../../src/common/decorators/current-admin.decorator';
import { IS_PUBLIC_KEY, Public } from '../../src/common/decorators/public.decorator';

function makeContext(user?: unknown, admin?: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, admin }),
    }),
    getHandler: () => () => {},
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('CurrentUser decorator factory', () => {
  it('returns req.user from the execution context', () => {
    const user = { id: 'user-1', name: 'Alice', householdId: 'hh-1' };
    const ctx = makeContext(user);
    expect(currentUserFactory(undefined, ctx)).toEqual(user);
  });

  it('returns undefined when req.user is not set', () => {
    const ctx = makeContext(undefined);
    expect(currentUserFactory(undefined, ctx)).toBeUndefined();
  });
});

describe('CurrentAdmin decorator factory', () => {
  it('returns req.admin from the execution context', () => {
    const admin = { id: 'admin-1', name: 'Admin' };
    const ctx = makeContext(undefined, admin);
    expect(currentAdminFactory(undefined, ctx)).toEqual(admin);
  });

  it('returns undefined when req.admin is not set', () => {
    const ctx = makeContext();
    expect(currentAdminFactory(undefined, ctx)).toBeUndefined();
  });
});

describe('Public decorator', () => {
  it('exports IS_PUBLIC_KEY as "isPublic"', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('sets isPublic metadata to true on a handler', () => {
    function testHandler() {}
    Public()(testHandler as any, 'testHandler', { value: testHandler });
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, testHandler);
    expect(metadata).toBe(true);
  });
});
