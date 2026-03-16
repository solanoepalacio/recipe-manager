import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { ReorderRequest } from '@recipe-manager/shared';

export class ReorderDto implements ReorderRequest {
  @ApiProperty({ type: [String], description: 'IDs in desired order' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
