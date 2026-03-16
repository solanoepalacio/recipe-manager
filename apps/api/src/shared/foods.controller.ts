import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all available foods (for ingredient pickers)' })
  @ApiResponse({ status: 200, description: 'List of all foods ordered by name' })
  findAll() {
    return this.prisma.food.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
