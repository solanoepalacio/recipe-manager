// apps/api/src/admin/auth/dto/admin-login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Admin password' })
  @IsString()
  @MinLength(1)
  password: string;
}
