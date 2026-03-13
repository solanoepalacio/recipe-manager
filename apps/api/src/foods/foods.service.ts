import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FoodListResponse } from '@recipe-manager/shared';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  async listFoods(q?: string): Promise<FoodListResponse> {
    const where = q
      ? { name: { contains: q, mode: 'insensitive' as const } }
      : {};

    const [foods, total] = await Promise.all([
      this.prisma.food.findMany({ where }),
      this.prisma.food.count({ where }),
    ]);

    return {
      items: foods.map((f) => ({ id: f.id, name: f.name })),
      total,
    };
  }
}
