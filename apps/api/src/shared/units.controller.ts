import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all available units (for ingredient pickers)' })
  @ApiResponse({ status: 200, description: 'List of all units ordered by name' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter units by name substring (case-insensitive)', type: String })
  findAll(@Query('name') name?: string) {
    const trimmed = name?.trim();
    return this.prisma.unit.findMany({
      where: trimmed ? { name: { contains: trimmed, mode: 'insensitive' } } : undefined,
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: 'asc' },
    });
  }
}
