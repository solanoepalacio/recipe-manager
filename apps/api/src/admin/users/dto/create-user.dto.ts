import { IsString, IsEmail, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminUserDto {
  @ApiProperty({ description: 'Household ID this user belongs to' })
  @IsUUID()
  householdId!: string;

  @ApiProperty({ description: 'User display name' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ description: 'Email address (unique)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Username (unique)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  username?: string;

  @ApiPropertyOptional({ description: 'Password — omit to create no-login member' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Gender string (e.g. "male", "female", "other")' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Date of birth (ISO 8601 string)' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}
