import { IsString, IsEmail, IsOptional, IsUUID, MinLength, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminUserDto {
  @ApiProperty({ description: 'Household ID this user belongs to' })
  @IsUUID()
  householdId!: string;

  @ApiProperty({ description: 'User display name' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ description: 'User type: normal, kid, or agent (default: normal)', enum: ['normal', 'kid', 'agent'] })
  @IsOptional()
  @IsString()
  @IsIn(['normal', 'kid', 'agent'])
  userType?: string;

  @ApiPropertyOptional({ description: 'Email address (required for normal users)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Password — required for normal users (min 8 chars)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Gender string (e.g. "male", "female", "other") — required for normal users' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Date of birth (ISO 8601 string) — required for normal and kid users' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
