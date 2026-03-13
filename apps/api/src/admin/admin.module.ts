import { Module } from '@nestjs/common';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';

@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
})
export class AdminModule {}
