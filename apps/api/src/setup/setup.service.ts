// apps/api/src/setup/setup.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 12;

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  async checkRequired(): Promise<{ required: boolean }> {
    const count = await this.prisma.admin.count();
    return { required: count === 0 };
  }

  async createAdmin(name: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await this.prisma.admin.create({
      data: { name, email, passwordHash },
    });
    return { message: 'Admin account created. Setup complete.' };
  }
}
