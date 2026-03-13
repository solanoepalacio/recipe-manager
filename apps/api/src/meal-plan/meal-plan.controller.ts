import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { MealPlanService } from './meal-plan.service';
import { CreateMealPlanEntryDto } from './dto/create-meal-plan-entry.dto';
import { UpdateMealPlanEntryDto } from './dto/update-meal-plan-entry.dto';
import { MealPlanQueryDto } from './dto/meal-plan-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type {
  MealPlanResponse,
  MealPlanEntryResponse,
} from '@recipe-manager/shared';

@ApiTags('meal-plan')
@Controller('meal-plan')
export class MealPlanController {
  constructor(private mealPlanService: MealPlanService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Meal plan with entries' })
  getMealPlan(
    @CurrentUser() user: { id: string; householdId: string },
    @Query() query: MealPlanQueryDto,
  ): Promise<MealPlanResponse> {
    return this.mealPlanService.getMealPlan(
      user.householdId,
      query.from,
      query.to,
    );
  }

  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Meal plan entry created' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  addEntry(
    @CurrentUser() user: { id: string; householdId: string },
    @Body() dto: CreateMealPlanEntryDto,
  ): Promise<MealPlanEntryResponse> {
    return this.mealPlanService.addEntry(user.householdId, dto);
  }

  @Patch('entries/:id')
  @ApiResponse({ status: 200, description: 'Meal plan entry updated' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  updateEntry(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanEntryDto,
  ): Promise<MealPlanEntryResponse> {
    return this.mealPlanService.updateEntry(user.householdId, id, dto);
  }

  @Delete('entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Meal plan entry deleted' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  deleteEntry(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('id') id: string,
  ): Promise<void> {
    return this.mealPlanService.deleteEntry(user.householdId, id);
  }
}
