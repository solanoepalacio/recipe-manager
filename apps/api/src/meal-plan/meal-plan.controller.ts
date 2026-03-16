import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MealPlanService } from './meal-plan.service';
import { CreateMealPlanEntryDto } from './dto/create-meal-plan-entry.dto';
import { UpdateMealPlanEntryDto } from './dto/update-meal-plan-entry.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('meal-plan')
@Controller('meal-plan')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  @Get()
  @ApiOperation({ summary: 'Get the household meal plan entries' })
  @ApiResponse({ status: 200, description: 'Meal plan entries' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'End date YYYY-MM-DD' })
  getEntries(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.mealPlanService.getEntries(user.householdId, from, to);
  }

  @Post('entries')
  @ApiOperation({ summary: 'Create a meal plan entry for the household' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createEntry(@CurrentUser() user: any, @Body() dto: CreateMealPlanEntryDto) {
    return this.mealPlanService.createEntry(user.householdId, dto);
  }

  @Patch('entries/:id')
  @ApiOperation({ summary: 'Update a meal plan entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  updateEntry(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateMealPlanEntryDto,
  ) {
    return this.mealPlanService.updateEntry(id, user.householdId, dto);
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Delete a meal plan entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  deleteEntry(@Param('id') id: string, @CurrentUser() user: any) {
    return this.mealPlanService.deleteEntry(id, user.householdId);
  }
}
