// apps/api/src/admin/auth/admin-auth.controller.ts
import {
  Controller, Post, Body, Req, Res, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Admin authenticated' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: AdminLoginDto, @Req() req: Request) {
    const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    req.session.adminId = admin.id;
    return { message: 'Admin authenticated' };
  }

  @UseGuards(AdminAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Admin session destroyed' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await new Promise<void>((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve())),
    );
    res.clearCookie('admin.sid');
    return { message: 'Logged out' };
  }
}
