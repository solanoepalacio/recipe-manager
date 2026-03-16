import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CreateStepRequest } from '@recipe-manager/shared';

export class CreateStepDto implements CreateStepRequest {
  @ApiPropertyOptional({ description: 'Optional step title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Step instruction body' })
  @IsString()
  body: string;
}
