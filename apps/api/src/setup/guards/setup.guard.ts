import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SetupGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ method: string }>();
    if (request.method !== 'POST') return true;

    const count = await this.prisma.admin.count();
    if (count > 0) {
      throw new NotFoundException('Setup already complete');
    }
    return true;
  }
}
