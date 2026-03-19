import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsDateString } from 'class-validator';
import { UpdateProfileRequest } from '@recipe-manager/shared';
import { Gender } from '@recipe-manager/shared';

export class UpdateProfileDto implements UpdateProfileRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currentPassword?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(6) password?: string;
}
