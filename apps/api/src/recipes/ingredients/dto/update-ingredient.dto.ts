import { IsUUID, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UpdateIngredientRequest } from '@recipe-manager/shared';

export class UpdateIngredientDto implements UpdateIngredientRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  foodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
