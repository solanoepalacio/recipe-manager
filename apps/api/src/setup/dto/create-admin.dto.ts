import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ description: 'Admin display name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Admin email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Admin password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
