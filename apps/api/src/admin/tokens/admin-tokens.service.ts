// apps/api/src/admin/tokens/admin-tokens.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminTokenResponse, AdminTokenCreatedResponse, PaginatedResponse } from '@recipe-manager/shared';
import { CreateAdminTokenDto } from './dto/create-token.dto';

function toAdminTokenResponse(token: {
  id: string; name: string; userId: string; createdById: string;
  createdAt: Date; lastUsedAt: Date | null;
  user?: { name: string; household?: { name: string } | null } | null;
}): AdminTokenResponse {
  return {
    id: token.id,
    name: token.name,
    userId: token.userId,
    userName: token.user?.name,
    householdName: token.user?.household?.name,
    createdById: token.createdById,
    createdAt: token.createdAt.toISOString(),
    lastUsedAt: token.lastUsedAt ? token.lastUsedAt.toISOString() : null,
  };
}

const TOKEN_SELECT = {
  id: true, name: true, userId: true, createdById: true, createdAt: true, lastUsedAt: true,
  // tokenHash is intentionally excluded — must NEVER appear in any response
  user: {
    select: {
      name: true,
      userType: true,
      household: { select: { name: true } },
    },
  },
} as const;

@Injectable()
export class AdminTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 20): Promise<PaginatedResponse<AdminTokenResponse>> {
    const [tokens, total] = await Promise.all([
      this.prisma.apiToken.findMany({
        select: TOKEN_SELECT,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiToken.count(),
    ]);
    return { items: tokens.map(toAdminTokenResponse), total, page, perPage };
  }

  async create(dto: CreateAdminTokenDto, adminId: string): Promise<AdminTokenCreatedResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    // Only agent-type users can have tokens
    if (user.userType !== 'agent') {
      throw new BadRequestException('Solo se pueden crear tokens para usuarios de tipo agente');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.apiToken.create({
      data: {
        name: dto.name,
        userId: dto.userId,
        createdById: adminId,
        tokenHash,
      },
      select: TOKEN_SELECT,
    });

    return {
      ...toAdminTokenResponse(token),
      token: rawToken, // raw token returned ONCE — not stored
    };
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Token ${id} not found`);
    await this.prisma.apiToken.delete({ where: { id } });
  }
}
