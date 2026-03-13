import { Module } from '@nestjs/common';
import { HouseholdController } from './household.controller';
import { HouseholdService } from './household.service';
import { MembersController } from './members/members.controller';
import { MembersService } from './members/members.service';

@Module({
  controllers: [HouseholdController, MembersController],
  providers: [HouseholdService, MembersService],
})
export class HouseholdModule {}
