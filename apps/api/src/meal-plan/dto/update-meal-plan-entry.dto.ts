import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';
import { MealType, UpdateMealPlanEntryRequest } from '@recipe-manager/shared';

export class UpdateMealPlanEntryDto implements UpdateMealPlanEntryRequest {
  @ApiPropertyOptional({ description: 'New recipe ID' })
  @IsOptional()
  @IsString()
  recipeId?: string;

  @ApiPropertyOptional({ description: 'New date in YYYY-MM-DD format' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ enum: MealType })
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;
}
