import {
  Controller,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { InstructionStepResponse } from '@recipe-manager/shared';

@ApiTags('recipes')
@Controller('recipes/:recipeId/steps')
export class StepsController {
  constructor(private stepsService: StepsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Step added' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  addStep(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Body() dto: CreateStepDto,
  ): Promise<InstructionStepResponse> {
    return this.stepsService.addStep(user.householdId, recipeId, dto);
  }

  @Patch(':stepId')
  @ApiResponse({ status: 200, description: 'Step updated' })
  @ApiResponse({ status: 404, description: 'Recipe or step not found' })
  updateStep(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
  ): Promise<InstructionStepResponse> {
    return this.stepsService.updateStep(
      user.householdId,
      recipeId,
      stepId,
      dto,
    );
  }

  @Delete(':stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Step deleted' })
  @ApiResponse({ status: 404, description: 'Recipe or step not found' })
  deleteStep(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('stepId') stepId: string,
  ): Promise<void> {
    return this.stepsService.deleteStep(user.householdId, recipeId, stepId);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Steps reordered' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  reorderSteps(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Body() dto: ReorderDto,
  ): Promise<void> {
    return this.stepsService.reorderSteps(user.householdId, recipeId, dto.ids);
  }
}
