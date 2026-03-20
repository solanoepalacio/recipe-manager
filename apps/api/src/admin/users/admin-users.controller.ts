// apps/api/src/admin/users/admin-users.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { AdminPaginationDto } from './dto/admin-pagination.dto';
import { CreateAdminUserDto } from './dto/create-user.dto';
import { UpdateAdminUserDto } from './dto/update-user.dto';
import { PasswordResetUrlResponse } from './dto/password-reset-url.dto';

@Public()
@ApiTags('admin-users')
@UseGuards(AdminAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  findAll(@Query() query: AdminPaginationDto) {
    return this.adminUsersService.findAll(query.page, query.perPage);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 404, description: 'Household not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminUsersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  remove(@Param('id') id: string) {
    return this.adminUsersService.remove(id);
  }

  @Post(':id/password-reset-url')
  @ApiOperation({ summary: 'Generate one-time password reset URL for a user (admin only)' })
  @ApiResponse({ status: 201, description: 'Reset URL generated — share out-of-band with the user', type: PasswordResetUrlResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Admin not authenticated' })
  generatePasswordResetUrl(@Param('id') id: string): Promise<PasswordResetUrlResponse> {
    return this.adminUsersService.generatePasswordResetUrl(id);
  }
}
