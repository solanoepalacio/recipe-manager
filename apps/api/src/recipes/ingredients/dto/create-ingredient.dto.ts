import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { CreateIngredientRequest } from '@recipe-manager/shared';

export class CreateIngredientDto implements CreateIngredientRequest {
  @ApiProperty({ description: 'Food ID from the foods table' })
  @IsString()
  foodId: string;

  @ApiPropertyOptional({ description: 'Unit ID from the units table' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Quantity (can be decimal)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Optional note (e.g. "finely chopped")' })
  @IsOptional()
  @IsString()
  note?: string;
}
