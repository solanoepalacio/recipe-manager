import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { SetupGuard } from './guards/setup.guard';

@Module({
  controllers: [SetupController],
  providers: [SetupService, SetupGuard],
})
export class SetupModule {}
