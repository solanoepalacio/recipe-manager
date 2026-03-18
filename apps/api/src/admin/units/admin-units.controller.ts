// apps/api/src/admin/units/admin-units.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminUnitsService } from './admin-units.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { AdminPaginationDto } from '../users/dto/admin-pagination.dto';
import { CreateAdminUnitDto } from './dto/create-unit.dto';
import { UpdateAdminUnitDto } from './dto/update-unit.dto';

@ApiTags('admin-units')
@UseGuards(AdminAuthGuard)
@Controller('admin/units')
export class AdminUnitsController {
  constructor(private readonly adminUnitsService: AdminUnitsService) {}

  @Get()
  @ApiOperation({ summary: 'List all units (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated unit list' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  findAll(@Query() query: AdminPaginationDto) {
    return this.adminUnitsService.findAll(query.page, query.perPage);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new unit' })
  @ApiResponse({ status: 201, description: 'Unit created' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  create(@Body() dto: CreateAdminUnitDto) {
    return this.adminUnitsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a unit' })
  @ApiResponse({ status: 200, description: 'Unit updated' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminUnitDto) {
    return this.adminUnitsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a unit' })
  @ApiResponse({ status: 204, description: 'Unit deleted' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  remove(@Param('id') id: string) {
    return this.adminUnitsService.remove(id);
  }
}
