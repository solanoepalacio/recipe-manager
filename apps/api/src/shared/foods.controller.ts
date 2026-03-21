import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all available foods (for ingredient pickers)' })
  @ApiResponse({ status: 200, description: 'List of all foods ordered by name' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter foods by name substring (case-insensitive)', type: String })
  findAll(@Query('name') name?: string) {
    const trimmed = name?.trim();
    return this.prisma.food.findMany({
      where: trimmed ? { name: { contains: trimmed, mode: 'insensitive' } } : undefined,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
