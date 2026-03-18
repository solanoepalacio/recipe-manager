import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminFoodDto {
  @ApiProperty({ description: 'Food name (must be unique)' })
  @IsString()
  @MinLength(1)
  name!: string;
}
