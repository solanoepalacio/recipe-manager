import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '../../common/decorators/public.decorator';
import '../../auth/types/session.types';


@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
  ): Promise<{ id: string; name: string; email: string }> {
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    req.session.adminId = admin.id;
    return { id: admin.id, name: admin.name, email: admin.email };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    res.clearCookie('connect.sid');
    return { message: 'Logged out' };
  }
}
