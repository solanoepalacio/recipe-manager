import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AdminCreateTokenRequest } from '@recipe-manager/shared';

export class AdminCreateTokenDto implements AdminCreateTokenRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsUUID()
  userId!: string;
}
