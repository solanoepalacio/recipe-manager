// apps/api/src/auth/auth.controller.ts
import {
  Controller, Get, Post, Body, Req, Res, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService, toMeResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email or username + password' })
  @ApiResponse({ status: 200, description: 'Returns authenticated user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.authService.validateUser(dto.email, dto.username, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    req.session.userId = user.id;
    return toMeResponse(user);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and destroy session' })
  @ApiResponse({ status: 200, description: 'Session destroyed' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await new Promise<void>((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve())),
    );
    res.clearCookie('connect.sid');
    return { message: 'Logged out' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user info' })
  @ApiResponse({ status: 200, description: 'Returns authenticated user info' })
  async me(@CurrentUser() user: any) {
    return toMeResponse(user);
  }
}
