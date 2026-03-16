// apps/api/src/auth/dto/login.dto.ts
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ description: 'User email address (one of email or username required)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Username (one of email or username required)' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(1)
  password: string;
}
