import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { SetupGuard } from './setup.guard';

describe('SetupGuard', () => {
  let guard: SetupGuard;
  let prisma: { admin: { count: jest.Mock } };

  beforeEach(() => {
    prisma = { admin: { count: jest.fn() } };
    guard = new SetupGuard(prisma as any);
  });

  const ctx = {} as ExecutionContext;

  it('returns true when no Admin exists (count === 0)', async () => {
    prisma.admin.count.mockResolvedValue(0);
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('throws NotFoundException when Admin already exists (count > 0)', async () => {
    prisma.admin.count.mockResolvedValue(1);
    await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('Setup already complete');
  });
});
