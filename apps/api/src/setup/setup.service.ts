import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { SetupStatusResponse, CreateAdminResponse } from '@recipe-manager/shared';

@Injectable()
export class SetupService {
  constructor(private prisma: PrismaService) {}

  async getStatus(): Promise<SetupStatusResponse> {
    const count = await this.prisma.admin.count();
    return { required: count === 0 };
  }

  async createAdmin(name: string, email: string, password: string): Promise<CreateAdminResponse> {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await this.prisma.admin.create({
      data: { name, email, passwordHash },
    });
    return { id: admin.id, name: admin.name, email: admin.email };
  }
}
