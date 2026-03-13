import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UpdateSectionRequest } from '@recipe-manager/shared';

export class UpdateSectionDto implements UpdateSectionRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}
