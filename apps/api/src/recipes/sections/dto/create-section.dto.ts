import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateSectionRequest } from '@recipe-manager/shared';

export class CreateSectionDto implements CreateSectionRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}
