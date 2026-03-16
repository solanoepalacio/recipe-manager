import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateSectionRequest } from '@recipe-manager/shared';

export class CreateSectionDto implements CreateSectionRequest {
  @ApiPropertyOptional({ description: 'Section title (e.g. "Dough", "Sauce")' })
  @IsOptional()
  @IsString()
  title?: string;
}
