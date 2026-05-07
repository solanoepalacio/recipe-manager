import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SetupModule } from './setup/setup.module';
import { RecipesModule } from './recipes/recipes.module';
import { SharedModule } from './shared/shared.module';
import { MealPlanModule } from './meal-plan/meal-plan.module';
import { ProfileModule } from './profile/profile.module';
import { HouseholdModule } from './household/household.module';
import { UmamiModule } from './umami/umami.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UmamiModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    SetupModule,
    RecipesModule,
    SharedModule,
    MealPlanModule,
    ProfileModule,
    HouseholdModule,
  ],
})
export class AppModule {}
