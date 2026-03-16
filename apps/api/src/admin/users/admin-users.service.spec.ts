// apps/api/src/admin/users/admin-users.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new AdminUsersService(prisma as any);
    process.env.APP_URL = 'http://localhost:3000';
  });

  it('throws NotFoundException when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.generatePasswordResetUrl('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('calls prisma.user.update with resetToken (SHA-256 hash) and resetTokenExpiry (+24h)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    const result = await service.generatePasswordResetUrl('u1');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      }),
    );

    // Verify the stored token is a SHA-256 hash (64 hex chars), not the raw token
    const updateCall = prisma.user.update.mock.calls[0][0];
    const storedHash: string = updateCall.data.resetToken;
    expect(storedHash).toHaveLength(64);
    expect(storedHash).toMatch(/^[0-9a-f]{64}$/);

    // Verify expiry is approximately 24h from now
    const expiry: Date = updateCall.data.resetTokenExpiry;
    const diffMs = expiry.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(23 * 60 * 60 * 1000); // > 23h
    expect(diffMs).toBeLessThan(25 * 60 * 60 * 1000);   // < 25h
  });

  it('returns resetUrl containing the raw token (not the hash)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockImplementation(async ({ data }) => {
      return { id: 'u1', resetToken: data.resetToken };
    });

    const result = await service.generatePasswordResetUrl('u1');

    // URL must exist and start with APP_URL
    expect(result.resetUrl).toMatch(/^http:\/\/localhost:3000\/reset-password\?token=/);

    // The token in the URL must be 64 hex chars (rawToken from randomBytes(32))
    const token = new URL(result.resetUrl).searchParams.get('token')!;
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);

    // The raw token in the URL is NOT equal to the stored hash
    const updateCall = prisma.user.update.mock.calls[0][0];
    const storedHash = updateCall.data.resetToken;
    expect(token).not.toBe(storedHash);

    // SHA-256 of the URL token equals the stored hash
    const expectedHash = createHash('sha256').update(token).digest('hex');
    expect(storedHash).toBe(expectedHash);
  });
});
