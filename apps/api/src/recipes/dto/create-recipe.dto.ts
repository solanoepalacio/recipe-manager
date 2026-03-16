import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUrl } from 'class-validator';
import { CreateRecipeRequest } from '@recipe-manager/shared';

export class CreateRecipeDto implements CreateRecipeRequest {
  @ApiProperty({ description: 'Recipe name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Plain text description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Serving quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  servingsQty?: number;

  @ApiPropertyOptional({ description: 'Serving unit label (e.g. "portions")' })
  @IsOptional()
  @IsString()
  servingsUnit?: string;

  @ApiPropertyOptional({ description: 'Prep time in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  prepTime?: number;

  @ApiPropertyOptional({ description: 'Cook time in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cookTime?: number;

  @ApiPropertyOptional({ description: 'Total time in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalTime?: number;

  @ApiPropertyOptional({ description: 'Active perform time in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  performTime?: number;

  @ApiPropertyOptional({ description: 'Source URL for the original recipe' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;
}
