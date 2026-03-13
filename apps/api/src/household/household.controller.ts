import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HouseholdService } from './household.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { HouseholdResponse } from '@recipe-manager/shared';

@ApiTags('household')
@Controller('household')
export class HouseholdController {
  constructor(private householdService: HouseholdService) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated user's household" })
  @ApiResponse({ status: 200, description: 'Household returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getHousehold(
    @CurrentUser() user: { householdId: string },
  ): Promise<HouseholdResponse> {
    return this.householdService.getHousehold(user.householdId);
  }
}
