import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UnitResponse, PaginatedResponse } from '@recipe-manager/shared';
import type { AdminUnitDto } from './dto/admin-unit.dto';

@Injectable()
export class AdminUnitsService {
  constructor(private prisma: PrismaService) {}

  async listUnits(
    page: number,
    perPage: number,
    q?: string,
  ): Promise<PaginatedResponse<UnitResponse>> {
    const skip = (page - 1) * perPage;
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { abbreviation: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        skip,
        take: perPage,
        where,
        orderBy: { name: 'asc' },
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      items: units.map((u) => ({ id: u.id, name: u.name, abbreviation: u.abbreviation })),
      total,
      page,
      perPage,
    };
  }

  async createUnit(dto: AdminUnitDto): Promise<UnitResponse> {
    const unit = await this.prisma.unit.create({
      data: { name: dto.name, abbreviation: dto.abbreviation },
    });
    return { id: unit.id, name: unit.name, abbreviation: unit.abbreviation };
  }

  async updateUnit(id: string, dto: AdminUnitDto): Promise<UnitResponse> {
    const existing = await this.prisma.unit.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Unit not found');
    }
    const unit = await this.prisma.unit.update({
      where: { id },
      data: { name: dto.name, abbreviation: dto.abbreviation },
    });
    return { id: unit.id, name: unit.name, abbreviation: unit.abbreviation };
  }

  async deleteUnit(id: string): Promise<void> {
    const existing = await this.prisma.unit.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Unit not found');
    }
    await this.prisma.unit.delete({ where: { id } });
  }
}
