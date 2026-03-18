// apps/api/src/admin/units/admin-units.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUnitResponse, PaginatedResponse } from '@recipe-manager/shared';
import { CreateAdminUnitDto } from './dto/create-unit.dto';
import { UpdateAdminUnitDto } from './dto/update-unit.dto';

function toAdminUnitResponse(unit: {
  id: string; name: string; abbreviation: string | null; createdAt: Date; updatedAt: Date;
}): AdminUnitResponse {
  return {
    id: unit.id, name: unit.name, abbreviation: unit.abbreviation,
    createdAt: unit.createdAt.toISOString(), updatedAt: unit.updatedAt.toISOString(),
  };
}

@Injectable()
export class AdminUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, perPage = 20): Promise<PaginatedResponse<AdminUnitResponse>> {
    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
      this.prisma.unit.count(),
    ]);
    return { items: units.map(toAdminUnitResponse), total, page, perPage };
  }

  async create(dto: CreateAdminUnitDto): Promise<AdminUnitResponse> {
    const unit = await this.prisma.unit.create({
      data: { name: dto.name, abbreviation: dto.abbreviation ?? null },
    });
    return toAdminUnitResponse(unit);
  }

  async update(id: string, dto: UpdateAdminUnitDto): Promise<AdminUnitResponse> {
    const existing = await this.prisma.unit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Unit ${id} not found`);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.abbreviation !== undefined) data.abbreviation = dto.abbreviation || null;
    const unit = await this.prisma.unit.update({ where: { id }, data });
    return toAdminUnitResponse(unit);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.unit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Unit ${id} not found`);
    await this.prisma.unit.delete({ where: { id } });
  }
}
