import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UpdateSectionRequest } from '@recipe-manager/shared';

export class UpdateSectionDto implements UpdateSectionRequest {
  @ApiPropertyOptional({ description: 'Section title (null to clear)' })
  @IsOptional()
  @IsString()
  title?: string | null;
}
