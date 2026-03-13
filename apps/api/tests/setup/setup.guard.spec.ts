import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { SetupGuard } from '../../src/setup/guards/setup.guard';

function makeExecutionContext(method: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method }),
    }),
  } as unknown as ExecutionContext;
}

describe('SetupGuard', () => {
  let guard: SetupGuard;
  let mockPrisma: {
    admin: { count: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      admin: { count: jest.fn() },
    };

    guard = new SetupGuard(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true for GET request regardless of admin count', async () => {
    mockPrisma.admin.count.mockResolvedValue(1);
    const ctx = makeExecutionContext('GET');

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockPrisma.admin.count).not.toHaveBeenCalled();
  });

  it('returns true for POST when no admin exists', async () => {
    mockPrisma.admin.count.mockResolvedValue(0);
    const ctx = makeExecutionContext('POST');

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockPrisma.admin.count).toHaveBeenCalled();
  });

  it('throws NotFoundException for POST when admin already exists', async () => {
    mockPrisma.admin.count.mockResolvedValue(1);
    const ctx = makeExecutionContext('POST');

    await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
  });
});
