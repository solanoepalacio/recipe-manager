import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const adminId: string | undefined = req.session?.adminId;
    if (!adminId) return false;
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return false;
    req.admin = admin;
    return true;
  }
}
