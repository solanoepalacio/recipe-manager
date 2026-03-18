import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUrl, IsBoolean } from 'class-validator';
import { UpdateRecipeRequest } from '@recipe-manager/shared';

export class UpdateRecipeDto implements UpdateRecipeRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) servingsQty?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() servingsUnit?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) prepTime?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) cookTime?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) totalTime?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) performTime?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsUrl() sourceUrl?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocked?: boolean;
}
