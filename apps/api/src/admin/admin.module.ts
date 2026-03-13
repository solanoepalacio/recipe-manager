import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminHouseholdsController } from './households/admin-households.controller';
import { AdminHouseholdsService } from './households/admin-households.service';
import { AdminFoodsController } from './foods/admin-foods.controller';
import { AdminFoodsService } from './foods/admin-foods.service';
import { AdminUnitsController } from './units/admin-units.controller';
import { AdminUnitsService } from './units/admin-units.service';
import { AdminTokensController } from './tokens/admin-tokens.controller';
import { AdminTokensService } from './tokens/admin-tokens.service';

@Module({
  imports: [PrismaModule],
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
    AdminAuthGuard,
    AdminUsersService,
    AdminHouseholdsService,
    AdminFoodsService,
    AdminUnitsService,
    AdminTokensService,
  ],
})
export class AdminModule {}
