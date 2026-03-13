import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AdminFoodRequest } from '@recipe-manager/shared';

export class AdminFoodDto implements AdminFoodRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
