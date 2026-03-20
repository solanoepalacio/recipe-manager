// apps/api/src/admin/tokens/admin-tokens.controller.ts
import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminTokensService } from './admin-tokens.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { AdminPaginationDto } from '../users/dto/admin-pagination.dto';
import { CreateAdminTokenDto } from './dto/create-token.dto';
import { CurrentAdmin } from '../../auth/decorators/current-admin.decorator';

@Public()
@ApiTags('admin-tokens')
@UseGuards(AdminAuthGuard)
@Controller('admin/tokens')
export class AdminTokensController {
  constructor(private readonly adminTokensService: AdminTokensService) {}

  @Get()
  @ApiOperation({ summary: 'List all API tokens (tokenHash never exposed)' })
  @ApiResponse({ status: 200, description: 'Paginated token list (id, name, userId, createdAt, lastUsedAt only)' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  findAll(@Query() query: AdminPaginationDto) {
    return this.adminTokensService.findAll(query.page, query.perPage);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API token — raw token returned once, never again' })
  @ApiResponse({ status: 201, description: 'Token created — save the raw token immediately' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  create(@Body() dto: CreateAdminTokenDto, @CurrentAdmin() admin: { id: string }) {
    return this.adminTokensService.create(dto, admin.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API token' })
  @ApiResponse({ status: 204, description: 'Token revoked' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  remove(@Param('id') id: string) {
    return this.adminTokensService.remove(id);
  }
}
