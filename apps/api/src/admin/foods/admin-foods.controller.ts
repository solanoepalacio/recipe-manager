import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { FoodResponse, PaginatedResponse } from '@recipe-manager/shared';
import { AdminFoodsService } from './admin-foods.service';
import { AdminFoodDto } from './dto/admin-food.dto';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin-foods')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Public()
@Controller('admin/foods')
export class AdminFoodsController {
  constructor(private adminFoodsService: AdminFoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated list of all foods' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Foods returned' })
  listFoods(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('q') q?: string,
  ): Promise<PaginatedResponse<FoodResponse>> {
    return this.adminFoodsService.listFoods(page, perPage, q);
  }

  @Post()
  @ApiOperation({ summary: 'Create a food' })
  @ApiResponse({ status: 201, description: 'Food created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createFood(@Body() dto: AdminFoodDto): Promise<FoodResponse> {
    return this.adminFoodsService.createFood(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a food' })
  @ApiResponse({ status: 200, description: 'Food updated' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  updateFood(@Param('id') id: string, @Body() dto: AdminFoodDto): Promise<FoodResponse> {
    return this.adminFoodsService.updateFood(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a food' })
  @ApiResponse({ status: 204, description: 'Food deleted' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  async deleteFood(@Param('id') id: string): Promise<void> {
    return this.adminFoodsService.deleteFood(id);
  }
}
