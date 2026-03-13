import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.session?.adminId) {
      throw new UnauthorizedException();
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: request.session.adminId },
    });

    if (!admin) {
      throw new UnauthorizedException();
    }

    request.admin = admin;
    return true;
  }
}
