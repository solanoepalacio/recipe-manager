// apps/api/src/admin/foods/admin-foods.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminFoodResponse, PaginatedResponse } from '@recipe-manager/shared';
import { CreateAdminFoodDto } from './dto/create-food.dto';
import { UpdateAdminFoodDto } from './dto/update-food.dto';

function toAdminFoodResponse(food: {
  id: string; name: string; createdAt: Date; updatedAt: Date;
}): AdminFoodResponse {
  return {
    id: food.id, name: food.name,
    createdAt: food.createdAt.toISOString(),
    updatedAt: food.updatedAt.toISOString(),
  };
}

@Injectable()
export class AdminFoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 20): Promise<PaginatedResponse<AdminFoodResponse>> {
    const [foods, total] = await Promise.all([
      this.prisma.food.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
      this.prisma.food.count(),
    ]);
    return { items: foods.map(toAdminFoodResponse), total, page, perPage };
  }

  async create(dto: CreateAdminFoodDto): Promise<AdminFoodResponse> {
    const food = await this.prisma.food.create({ data: { name: dto.name } });
    return toAdminFoodResponse(food);
  }

  async update(id: string, dto: UpdateAdminFoodDto): Promise<AdminFoodResponse> {
    const existing = await this.prisma.food.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Food ${id} not found`);
    const food = await this.prisma.food.update({
      where: { id },
      data: { name: dto.name },
    });
    return toAdminFoodResponse(food);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.food.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Food ${id} not found`);
    await this.prisma.food.delete({ where: { id } });
  }
}
