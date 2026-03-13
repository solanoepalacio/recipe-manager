import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AnyAuthGuard } from './auth/guards/any-auth.guard';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SetupModule } from './setup/setup.module';

@Module({
  imports: [PrismaModule, AuthModule, AdminModule, SetupModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AnyAuthGuard,
    },
  ],
})
export class AppModule {}
