import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import type { UnitListResponse } from '@recipe-manager/shared';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(private unitsService: UnitsService) {}

  @Get()
  @ApiOperation({ summary: 'List all units' })
  @ApiResponse({ status: 200, description: 'Units returned' })
  listUnits(): Promise<UnitListResponse> {
    return this.unitsService.listUnits();
  }
}
