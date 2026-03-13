import { IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MealType } from '@recipe-manager/shared';
import type { CreateMealPlanEntryRequest } from '@recipe-manager/shared';

export class CreateMealPlanEntryDto implements CreateMealPlanEntryRequest {
  @ApiProperty({ description: 'Recipe ID (UUID)' })
  @IsUUID()
  recipeId!: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: MealType, description: 'Meal type' })
  @IsEnum(MealType)
  mealType!: MealType;
}
