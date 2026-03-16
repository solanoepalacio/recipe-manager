import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all available units (for ingredient pickers)' })
  @ApiResponse({ status: 200, description: 'List of all units ordered by name' })
  findAll() {
    return this.prisma.unit.findMany({
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: 'asc' },
    });
  }
}
