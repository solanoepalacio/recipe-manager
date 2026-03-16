import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { UpdateIngredientRequest } from '@recipe-manager/shared';

export class UpdateIngredientDto implements UpdateIngredientRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() foodId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) quantity?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string | null;
}
