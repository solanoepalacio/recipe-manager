import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HouseholdService } from './household.service';
import { AnyAuthGuard } from '../auth/guards/any-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('household')
@UseGuards(AnyAuthGuard)
@Controller('household')
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's household with members" })
  @ApiResponse({ status: 200, description: 'Household info with members' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getHousehold(@CurrentUser() user: { id: string; householdId: string }) {
    return this.householdService.getHousehold(user.householdId);
  }
}
