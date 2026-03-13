import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Try session auth
    if (request.session?.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: request.session.userId },
      });
      if (user) {
        request.user = user;
        return true;
      }
    }

    // Try API key auth
    const authHeader: string | undefined = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7);
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const apiToken = await this.prisma.apiToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (apiToken) {
        request.user = apiToken.user;
        this.prisma.apiToken
          .update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } })
          .catch(() => {});
        return true;
      }
    }

    throw new UnauthorizedException();
  }
}
