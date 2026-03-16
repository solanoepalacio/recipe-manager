import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SetupModule } from './setup/setup.module';
import { RecipesModule } from './recipes/recipes.module';
import { SharedModule } from './shared/shared.module';
import { MealPlanModule } from './meal-plan/meal-plan.module';

@Module({
  imports: [PrismaModule, AuthModule, AdminModule, SetupModule, RecipesModule, SharedModule, MealPlanModule],
})
export class AppModule {}
