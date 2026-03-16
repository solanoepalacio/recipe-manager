// apps/api/src/admin/auth/admin-auth.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) return null;
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return null;
    return admin;
  }
}
