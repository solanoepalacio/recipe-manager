import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminHouseholdDto {
  @ApiProperty({ description: 'Household name' })
  @IsString()
  @MinLength(1)
  name!: string;
}
