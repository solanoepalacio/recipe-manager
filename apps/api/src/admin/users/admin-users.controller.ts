// apps/api/src/admin/users/admin-users.controller.ts
import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { PasswordResetUrlResponse } from './dto/password-reset-url.dto';

@ApiTags('admin-users')
@UseGuards(AdminAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post(':id/password-reset-url')
  @ApiOperation({ summary: 'Generate one-time password reset URL for a user (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Reset URL generated — share out-of-band with the user',
    type: PasswordResetUrlResponse,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  async generatePasswordResetUrl(@Param('id') id: string): Promise<PasswordResetUrlResponse> {
    return this.adminUsersService.generatePasswordResetUrl(id);
  }
}
