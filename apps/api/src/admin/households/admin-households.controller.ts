// apps/api/src/admin/households/admin-households.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminHouseholdsService } from './admin-households.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { AdminPaginationDto } from '../users/dto/admin-pagination.dto';
import { CreateAdminHouseholdDto } from './dto/create-household.dto';
import { UpdateAdminHouseholdDto } from './dto/update-household.dto';

@Public()
@ApiTags('admin-households')
@UseGuards(AdminAuthGuard)
@Controller('admin/households')
export class AdminHouseholdsController {
  constructor(private readonly adminHouseholdsService: AdminHouseholdsService) {}

  @Get()
  @ApiOperation({ summary: 'List all households (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated household list' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  findAll(@Query() query: AdminPaginationDto) {
    return this.adminHouseholdsService.findAll(query.page, query.perPage);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new household' })
  @ApiResponse({ status: 201, description: 'Household created' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  create(@Body() dto: CreateAdminHouseholdDto) {
    return this.adminHouseholdsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single household with its members' })
  @ApiResponse({ status: 200, description: 'Household with members list' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  findOne(@Param('id') id: string) {
    return this.adminHouseholdsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update household name' })
  @ApiResponse({ status: 200, description: 'Household updated' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminHouseholdDto) {
    return this.adminHouseholdsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a household and all its data' })
  @ApiResponse({ status: 204, description: 'Household deleted' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  remove(@Param('id') id: string) {
    return this.adminHouseholdsService.remove(id);
  }
}
