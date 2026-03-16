// apps/api/src/admin/users/admin-users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePasswordResetUrl(userId: string): Promise<{ resetUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: tokenHash,
        resetTokenExpiry: expiresAt,
      },
    });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
    return { resetUrl };
  }
}
