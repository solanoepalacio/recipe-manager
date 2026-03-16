import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AnyAuthGuard } from './guards/any-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { ApiKeyAuthGuard } from './guards/api-key.guard';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Module({
  providers: [
    SessionAuthGuard,
    ApiKeyAuthGuard,
    AdminAuthGuard,
    AnyAuthGuard,
    {
      provide: APP_GUARD,
      useClass: AnyAuthGuard,
    },
  ],
  exports: [SessionAuthGuard, ApiKeyAuthGuard, AdminAuthGuard, AnyAuthGuard],
})
export class AuthModule {}
