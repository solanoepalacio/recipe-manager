import { Controller, Post, Patch, Delete, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('recipes')
@Controller('recipes/:id/steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  // CRITICAL: reorder MUST be declared before :stepId to avoid NestJS route collision
  @Put('reorder')
  @ApiOperation({ summary: 'Reorder instruction steps' })
  @ApiResponse({ status: 200 })
  reorder(@Param('id') recipeId: string, @CurrentUser() user: any, @Body() dto: ReorderDto) {
    return this.stepsService.reorder(recipeId, user.householdId, dto.ids);
  }

  @Post()
  @ApiOperation({ summary: 'Add an instruction step' })
  @ApiResponse({ status: 201 })
  create(@Param('id') recipeId: string, @CurrentUser() user: any, @Body() dto: CreateStepDto) {
    return this.stepsService.create(recipeId, user.householdId, dto);
  }

  @Patch(':stepId')
  @ApiOperation({ summary: 'Edit a step' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id') recipeId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStepDto,
  ) {
    return this.stepsService.update(recipeId, user.householdId, stepId, dto);
  }

  @Delete(':stepId')
  @ApiOperation({ summary: 'Delete a step' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') recipeId: string, @Param('stepId') stepId: string, @CurrentUser() user: any) {
    return this.stepsService.remove(recipeId, user.householdId, stepId);
  }
}
