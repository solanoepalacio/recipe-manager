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
import type {
  AdminUserResponse,
  PaginatedResponse,
  PasswordResetUrlResponse,
} from '@recipe-manager/shared';
import { AdminUsersService } from './admin-users.service';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Public()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated list of all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
  ): Promise<PaginatedResponse<AdminUserResponse>> {
    return this.adminUsersService.listUsers(page, perPage);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createUser(@Body() dto: AdminCreateUserDto): Promise<AdminUserResponse> {
    return this.adminUsersService.createUser(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user' })
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUser(@Param('id') id: string): Promise<AdminUserResponse> {
    return this.adminUsersService.getUser(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<AdminUserResponse> {
    return this.adminUsersService.updateUser(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.adminUsersService.deleteUser(id);
  }

  @Post(':id/password-reset-url')
  @ApiOperation({ summary: 'Generate a password reset URL for a user' })
  @ApiResponse({ status: 201, description: 'Reset URL generated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  generatePasswordResetUrl(@Param('id') id: string): Promise<PasswordResetUrlResponse> {
    return this.adminUsersService.generatePasswordResetUrl(id);
  }
}
