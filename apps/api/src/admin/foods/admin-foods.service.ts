import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { FoodResponse, PaginatedResponse } from '@recipe-manager/shared';
import type { AdminFoodDto } from './dto/admin-food.dto';

@Injectable()
export class AdminFoodsService {
  constructor(private prisma: PrismaService) {}

  async listFoods(
    page: number,
    perPage: number,
    q?: string,
  ): Promise<PaginatedResponse<FoodResponse>> {
    const skip = (page - 1) * perPage;
    const where = q
      ? { name: { contains: q, mode: 'insensitive' as const } }
      : {};

    const [foods, total] = await Promise.all([
      this.prisma.food.findMany({
        skip,
        take: perPage,
        where,
        orderBy: { name: 'asc' },
      }),
      this.prisma.food.count({ where }),
    ]);

    return {
      items: foods.map((f) => ({ id: f.id, name: f.name })),
      total,
      page,
      perPage,
    };
  }

  async createFood(dto: AdminFoodDto): Promise<FoodResponse> {
    const food = await this.prisma.food.create({ data: { name: dto.name } });
    return { id: food.id, name: food.name };
  }

  async updateFood(id: string, dto: AdminFoodDto): Promise<FoodResponse> {
    const existing = await this.prisma.food.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Food not found');
    }
    const food = await this.prisma.food.update({
      where: { id },
      data: { name: dto.name },
    });
    return { id: food.id, name: food.name };
  }

  async deleteFood(id: string): Promise<void> {
    const existing = await this.prisma.food.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Food not found');
    }
    await this.prisma.food.delete({ where: { id } });
  }
}
