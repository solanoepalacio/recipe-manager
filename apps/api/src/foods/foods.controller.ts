import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FoodsService } from './foods.service';
import type { FoodListResponse } from '@recipe-manager/shared';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all foods with optional search' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Foods returned' })
  listFoods(@Query('q') q?: string): Promise<FoodListResponse> {
    return this.foodsService.listFoods(q);
  }
}
