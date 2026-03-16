import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { UnitsController } from './units.controller';

@Module({
  controllers: [FoodsController, UnitsController],
})
export class SharedModule {}
