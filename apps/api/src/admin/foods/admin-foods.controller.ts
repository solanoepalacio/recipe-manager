// apps/api/src/admin/foods/admin-foods.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminFoodsService } from './admin-foods.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { AdminPaginationDto } from '../users/dto/admin-pagination.dto';
import { CreateAdminFoodDto } from './dto/create-food.dto';
import { UpdateAdminFoodDto } from './dto/update-food.dto';

@ApiTags('admin-foods')
@UseGuards(AdminAuthGuard)
@Controller('admin/foods')
export class AdminFoodsController {
  constructor(private readonly adminFoodsService: AdminFoodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all foods (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated food list' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  findAll(@Query() query: AdminPaginationDto) {
    return this.adminFoodsService.findAll(query.page, query.perPage);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new food' })
  @ApiResponse({ status: 201, description: 'Food created' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  create(@Body() dto: CreateAdminFoodDto) {
    return this.adminFoodsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a food' })
  @ApiResponse({ status: 200, description: 'Food updated' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminFoodDto) {
    return this.adminFoodsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a food' })
  @ApiResponse({ status: 204, description: 'Food deleted' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  remove(@Param('id') id: string) {
    return this.adminFoodsService.remove(id);
  }
}
