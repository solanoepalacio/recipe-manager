import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminUnitDto {
  @ApiPropertyOptional({ description: 'New unit name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: 'New abbreviation (pass empty string to clear)' })
  @IsOptional()
  @IsString()
  abbreviation?: string;
}
