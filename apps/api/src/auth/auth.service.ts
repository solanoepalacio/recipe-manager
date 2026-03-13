import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { LoginResponse, MeResponse } from '@recipe-manager/shared';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(login: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordHash: { not: null },
        OR: [{ email: login }, { username: login }],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  toLoginResponse(user: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    householdId: string;
  }): LoginResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      householdId: user.householdId,
    };
  }

  toMeResponse(user: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    householdId: string;
  }): MeResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      householdId: user.householdId,
    };
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Password reset successful' };
  }
}
