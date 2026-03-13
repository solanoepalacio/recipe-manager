import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// M0.5 verification: shared types are accessible from @recipe-manager/shared
import type { Placeholder } from '@recipe-manager/shared';

// This verifies the cross-workspace import compiles correctly
type _VerifySharedImport = Placeholder;

@Module({
  controllers: [AppController],
})
export class AppModule {}
