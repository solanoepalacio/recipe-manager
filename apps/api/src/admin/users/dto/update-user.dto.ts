import { IsString, IsEmail, IsOptional, IsUUID, MinLength, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: 'User type: normal, kid, or agent', enum: ['normal', 'kid', 'agent'] })
  @IsOptional()
  @IsString()
  @IsIn(['normal', 'kid', 'agent'])
  userType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'New password — omit to keep existing' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Move user to a different household' })
  @IsOptional()
  @IsUUID()
  householdId?: string;
}
