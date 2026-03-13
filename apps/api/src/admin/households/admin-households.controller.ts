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
import type { AdminHouseholdResponse, PaginatedResponse } from '@recipe-manager/shared';
import { AdminHouseholdsService } from './admin-households.service';
import { AdminCreateHouseholdDto } from './dto/create-household.dto';
import { AdminUpdateHouseholdDto } from './dto/update-household.dto';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin-households')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Public()
@Controller('admin/households')
export class AdminHouseholdsController {
  constructor(private adminHouseholdsService: AdminHouseholdsService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated list of all households' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Households returned' })
  listHouseholds(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ): Promise<PaginatedResponse<AdminHouseholdResponse>> {
    return this.adminHouseholdsService.listHouseholds(page, perPage);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new household' })
  @ApiResponse({ status: 201, description: 'Household created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createHousehold(@Body() dto: AdminCreateHouseholdDto): Promise<AdminHouseholdResponse> {
    return this.adminHouseholdsService.createHousehold(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a household with its members' })
  @ApiResponse({ status: 200, description: 'Household returned' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  getHousehold(@Param('id') id: string): Promise<AdminHouseholdResponse> {
    return this.adminHouseholdsService.getHousehold(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a household' })
  @ApiResponse({ status: 200, description: 'Household updated' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  updateHousehold(
    @Param('id') id: string,
    @Body() dto: AdminUpdateHouseholdDto,
  ): Promise<AdminHouseholdResponse> {
    return this.adminHouseholdsService.updateHousehold(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a household and all its data' })
  @ApiResponse({ status: 204, description: 'Household deleted' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  async deleteHousehold(@Param('id') id: string): Promise<void> {
    return this.adminHouseholdsService.deleteHousehold(id);
  }
}
