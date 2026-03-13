import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '@recipe-manager/shared';
import type { UpdateMealPlanEntryRequest } from '@recipe-manager/shared';

export class UpdateMealPlanEntryDto implements UpdateMealPlanEntryRequest {
  @ApiPropertyOptional({ description: 'Date in YYYY-MM-DD format' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: MealType, description: 'Meal type' })
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;
}
