import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UnitListResponse } from '@recipe-manager/shared';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async listUnits(): Promise<UnitListResponse> {
    const units = await this.prisma.unit.findMany({});
    return {
      items: units.map((u) => ({
        id: u.id,
        name: u.name,
        abbreviation: u.abbreviation ?? null,
      })),
    };
  }
}
