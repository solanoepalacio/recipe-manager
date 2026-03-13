import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { LoginRequest } from '@recipe-manager/shared';

export class LoginDto implements LoginRequest {
  @ApiProperty({ description: 'Email or username' })
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
