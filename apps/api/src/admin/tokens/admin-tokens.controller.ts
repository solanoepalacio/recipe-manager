import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { AdminTokenResponse, AdminCreateTokenResponse } from '@recipe-manager/shared';
import type { Admin } from '@prisma/client';
import { AdminTokensService } from './admin-tokens.service';
import { AdminCreateTokenDto } from './dto/create-token.dto';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin-tokens')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Public()
@Controller('admin/tokens')
export class AdminTokensController {
  constructor(private adminTokensService: AdminTokensService) {}

  @Get()
  @ApiOperation({ summary: 'List all API tokens (metadata only)' })
  @ApiResponse({ status: 200, description: 'Tokens returned' })
  listTokens(): Promise<AdminTokenResponse[]> {
    return this.adminTokensService.listTokens();
  }

  @Post()
  @ApiOperation({ summary: 'Create an API token — raw token returned once' })
  @ApiResponse({ status: 201, description: 'Token created with raw token' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createToken(
    @CurrentAdmin() admin: Admin,
    @Body() dto: AdminCreateTokenDto,
  ): Promise<AdminCreateTokenResponse> {
    return this.adminTokensService.createToken(admin.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API token' })
  @ApiResponse({ status: 204, description: 'Token revoked' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async deleteToken(@Param('id') id: string): Promise<void> {
    return this.adminTokensService.deleteToken(id);
  }
}
