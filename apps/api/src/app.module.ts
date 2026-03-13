import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// M1 verification: shared types are accessible from @recipe-manager/shared
import type { ErrorResponse } from '@recipe-manager/shared';

// This verifies the cross-workspace import compiles correctly
type _VerifySharedImport = ErrorResponse;

@Module({
  controllers: [AppController],
})
export class AppModule {}
