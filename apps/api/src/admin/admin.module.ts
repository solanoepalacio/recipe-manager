// apps/api/src/admin/admin.module.ts
import { Module } from '@nestjs/common';

// auth sub-module (existing)
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';

// users sub-module (expanded in plan 06-02)
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

// households sub-module (plan 06-03)
import { AdminHouseholdsController } from './households/admin-households.controller';
import { AdminHouseholdsService } from './households/admin-households.service';

// foods sub-module (plan 06-04)
import { AdminFoodsController } from './foods/admin-foods.controller';
import { AdminFoodsService } from './foods/admin-foods.service';

// units sub-module (plan 06-04)
import { AdminUnitsController } from './units/admin-units.controller';
import { AdminUnitsService } from './units/admin-units.service';

// tokens sub-module (plan 06-05)
import { AdminTokensController } from './tokens/admin-tokens.controller';
import { AdminTokensService } from './tokens/admin-tokens.service';

@Module({
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminHouseholdsController,
    AdminFoodsController,
    AdminUnitsController,
    AdminTokensController,
  ],
  providers: [
    AdminAuthService,
    AdminUsersService,
    AdminHouseholdsService,
    AdminFoodsService,
    AdminUnitsService,
    AdminTokensService,
  ],
  exports: [AdminAuthService, AdminUsersService],
})
export class AdminModule {}
