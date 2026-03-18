import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminHouseholdDto {
  @ApiPropertyOptional({ description: 'New household name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
