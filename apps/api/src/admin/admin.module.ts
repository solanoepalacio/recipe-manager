// apps/api/src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminHouseholdsController } from './households/admin-households.controller';
import { AdminHouseholdsService } from './households/admin-households.service';

@Module({
  controllers: [AdminAuthController, AdminUsersController, AdminHouseholdsController],
  providers: [AdminAuthService, AdminUsersService, AdminHouseholdsService],
  exports: [AdminAuthService, AdminUsersService, AdminHouseholdsService],
})
export class AdminModule {}
