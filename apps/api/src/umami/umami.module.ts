import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UmamiService } from './umami.service';

@Global()
@Module({
  imports: [HttpModule.register({ timeout: 2000 })],
  providers: [UmamiService],
  exports: [UmamiService],
})
export class UmamiModule {}
