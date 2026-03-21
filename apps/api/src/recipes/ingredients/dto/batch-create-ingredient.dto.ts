import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BatchCreateIngredientsRequest } from '@recipe-manager/shared';

export class BatchIngredientItemDto {
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

export class BatchCreateIngredientsDto implements BatchCreateIngredientsRequest {
  @ApiProperty({ type: [BatchIngredientItemDto], description: 'Array of ingredients to add' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchIngredientItemDto)
  ingredients: BatchIngredientItemDto[];
}
