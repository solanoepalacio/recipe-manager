import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminTokenResponse,
  AdminCreateTokenResponse,
} from '@recipe-manager/shared';
import type { AdminCreateTokenDto } from './dto/create-token.dto';

type TokenWithUser = {
  id: string;
  name: string;
  tokenHash: string;
  userId: string;
  createdById: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  user: { id: string; name: string };
};

@Injectable()
export class AdminTokensService {
  constructor(private prisma: PrismaService) {}

  async listTokens(): Promise<AdminTokenResponse[]> {
    const tokens = await this.prisma.apiToken.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((t) => this.toAdminTokenResponse(t as TokenWithUser));
  }

  async createToken(
    adminId: string,
    dto: AdminCreateTokenDto,
  ): Promise<AdminCreateTokenResponse> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.apiToken.create({
      data: {
        name: dto.name,
        tokenHash,
        userId: dto.userId,
        createdById: adminId,
      },
    });

    return {
      id: token.id,
      name: token.name,
      token: rawToken,
    };
  }

  async deleteToken(id: string): Promise<void> {
    const existing = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Token not found');
    }
    await this.prisma.apiToken.delete({ where: { id } });
  }

  private toAdminTokenResponse(token: TokenWithUser): AdminTokenResponse {
    return {
      id: token.id,
      name: token.name,
      userId: token.userId,
      userName: token.user.name,
      createdAt: token.createdAt.toISOString(),
      lastUsedAt: token.lastUsedAt ? token.lastUsedAt.toISOString() : null,
    };
  }
}
