import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AdminCreateHouseholdRequest } from '@recipe-manager/shared';

export class AdminCreateHouseholdDto implements AdminCreateHouseholdRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
