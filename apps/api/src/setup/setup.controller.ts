// apps/api/src/setup/setup.controller.ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { SetupGuard } from './guards/setup.guard';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check if first-time setup is required' })
  @ApiResponse({ status: 200, description: 'Returns { required: boolean }' })
  async checkRequired() {
    return this.setupService.checkRequired();
  }

  @Public()
  @UseGuards(SetupGuard)
  @Post()
  @ApiOperation({ summary: 'Complete first-time setup — create Admin account' })
  @ApiResponse({ status: 201, description: 'Admin account created' })
  @ApiResponse({ status: 404, description: 'Setup already complete' })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.setupService.createAdmin(dto.name, dto.email, dto.password);
  }
}
