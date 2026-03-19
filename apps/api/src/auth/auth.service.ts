// apps/api/src/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MeResponse } from '@recipe-manager/shared';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user || !user.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: { resetToken: tokenHash },
    });

    if (!user) {
      throw new BadRequestException('Token de restablecimiento no válido o ya utilizado');
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('El token de restablecimiento ha expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }
}

export function toMeResponse(user: {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MeResponse {
  return {
    id: user.id,
    householdId: user.householdId,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
