import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) return false;

    const rawToken = authHeader.slice(7);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const apiToken = await this.prisma.apiToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!apiToken) return false;

    // Attach user to request
    request.user = apiToken.user;

    // Update lastUsedAt asynchronously (non-blocking)
    this.prisma.apiToken
      .update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return true;
  }
}
