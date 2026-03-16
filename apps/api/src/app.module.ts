import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SetupModule } from './setup/setup.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [PrismaModule, AuthModule, AdminModule, SetupModule, RecipesModule],
})
export class AppModule {}
