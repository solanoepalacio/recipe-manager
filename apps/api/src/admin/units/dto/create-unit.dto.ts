import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminUnitDto {
  @ApiProperty({ description: 'Unit name (must be unique, e.g. "cup", "tablespoon")' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ description: 'Abbreviation (e.g. "c", "tbsp")' })
  @IsOptional()
  @IsString()
  abbreviation?: string;
}
