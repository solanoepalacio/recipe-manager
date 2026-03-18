import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminFoodDto {
  @ApiPropertyOptional({ description: 'New food name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
