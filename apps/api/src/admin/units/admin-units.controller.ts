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
import type { UnitResponse, PaginatedResponse } from '@recipe-manager/shared';
import { AdminUnitsService } from './admin-units.service';
import { AdminUnitDto } from './dto/admin-unit.dto';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin-units')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Public()
@Controller('admin/units')
export class AdminUnitsController {
  constructor(private adminUnitsService: AdminUnitsService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated list of all units' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Units returned' })
  listUnits(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('q') q?: string,
  ): Promise<PaginatedResponse<UnitResponse>> {
    return this.adminUnitsService.listUnits(page, perPage, q);
  }

  @Post()
  @ApiOperation({ summary: 'Create a unit' })
  @ApiResponse({ status: 201, description: 'Unit created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createUnit(@Body() dto: AdminUnitDto): Promise<UnitResponse> {
    return this.adminUnitsService.createUnit(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a unit' })
  @ApiResponse({ status: 200, description: 'Unit updated' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  updateUnit(@Param('id') id: string, @Body() dto: AdminUnitDto): Promise<UnitResponse> {
    return this.adminUnitsService.updateUnit(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a unit' })
  @ApiResponse({ status: 204, description: 'Unit deleted' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  async deleteUnit(@Param('id') id: string): Promise<void> {
    return this.adminUnitsService.deleteUnit(id);
  }
}
