import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortField {
  Name = 'name',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Random = 'random',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export class RecipeQueryDto {
  @ApiPropertyOptional({ description: 'Search recipe name (case-insensitive substring match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by food ID — returns recipes containing an ingredient with this food' })
  @IsOptional()
  @IsString()
  foodId?: string;

  @ApiPropertyOptional({ enum: SortField, default: SortField.CreatedAt })
  @IsOptional()
  @IsEnum(SortField)
  sort?: SortField = SortField.CreatedAt;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.Desc })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.Desc;

  @ApiPropertyOptional({ default: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
