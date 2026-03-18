import { IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminTokenDto {
  @ApiProperty({ description: 'Token name/label for identification' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ description: 'User ID this token authenticates as' })
  @IsUUID()
  userId!: string;
}
