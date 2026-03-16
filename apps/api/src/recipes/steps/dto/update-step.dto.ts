import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { UpdateStepRequest } from '@recipe-manager/shared';

export class UpdateStepDto implements UpdateStepRequest {
  @ApiPropertyOptional({ description: 'Step title (null to clear)' })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({ description: 'Step instruction body' })
  @IsOptional()
  @IsString()
  body?: string;
}
