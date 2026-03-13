import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { AdminUpdateHouseholdRequest } from '@recipe-manager/shared';

export class AdminUpdateHouseholdDto implements AdminUpdateHouseholdRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
