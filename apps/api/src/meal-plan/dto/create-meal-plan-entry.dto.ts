import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, Matches } from 'class-validator';
import { MealType, CreateMealPlanEntryRequest } from '@recipe-manager/shared';

export class CreateMealPlanEntryDto implements CreateMealPlanEntryRequest {
  @ApiProperty({ description: 'Recipe ID to assign' })
  @IsString()
  recipeId: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  mealType: MealType;
}
