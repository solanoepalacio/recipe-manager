import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.session?.userId;
    if (!userId) return false;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    req.user = user;
    return true;
  }
}
