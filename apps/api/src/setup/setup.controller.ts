import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { SetupGuard } from './guards/setup.guard';
import { Public } from '../common/decorators/public.decorator';
import type { SetupStatusResponse, CreateAdminResponse } from '@recipe-manager/shared';

@ApiTags('setup')
@Controller('setup')
@Public()
export class SetupController {
  constructor(private setupService: SetupService) {}

  @Get()
  @ApiOperation({ summary: 'Check if setup is required' })
  @ApiResponse({ status: 200, description: 'Returns whether first-time setup is required' })
  getStatus(): Promise<SetupStatusResponse> {
    return this.setupService.getStatus();
  }

  @Post()
  @UseGuards(SetupGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create first admin user' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 404, description: 'Setup already complete' })
  createAdmin(@Body() dto: CreateAdminDto): Promise<CreateAdminResponse> {
    return this.setupService.createAdmin(dto.name, dto.email, dto.password);
  }
}
