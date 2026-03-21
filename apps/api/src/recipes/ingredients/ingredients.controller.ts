import { Controller, Post, Patch, Delete, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { BatchCreateIngredientsDto } from './dto/batch-create-ingredient.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SectionResponse } from '@recipe-manager/shared';

@ApiTags('recipes')
@Controller('recipes/:id/sections/:sectionId/ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  // CRITICAL: batch and reorder before :ingredientId to prevent route collision
  @Post('batch')
  @ApiOperation({ summary: 'Add multiple ingredients to a section atomically' })
  @ApiResponse({ status: 201, description: 'Ingredients created, returns updated section' })
  batchCreate(
    @Param('id') recipeId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: any,
    @Body() dto: BatchCreateIngredientsDto,
  ): Promise<SectionResponse> {
    return this.ingredientsService.batchCreate(recipeId, user.householdId, sectionId, dto);
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reorder ingredients within a section' })
  @ApiResponse({ status: 200 })
  reorder(
    @Param('id') recipeId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: any,
    @Body() dto: ReorderDto,
  ) {
    return this.ingredientsService.reorder(recipeId, user.householdId, dto.ids);
  }

  @Post()
  @ApiOperation({ summary: 'Add an ingredient to a section' })
  @ApiResponse({ status: 201 })
  create(
    @Param('id') recipeId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateIngredientDto,
  ) {
    return this.ingredientsService.create(recipeId, user.householdId, sectionId, dto);
  }

  @Patch(':ingredientId')
  @ApiOperation({ summary: 'Edit an ingredient' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id') recipeId: string,
    @Param('sectionId') sectionId: string,
    @Param('ingredientId') ingredientId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(recipeId, user.householdId, sectionId, ingredientId, dto);
  }

  @Delete(':ingredientId')
  @ApiOperation({ summary: 'Remove an ingredient' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id') recipeId: string,
    @Param('sectionId') sectionId: string,
    @Param('ingredientId') ingredientId: string,
    @CurrentUser() user: any,
  ) {
    return this.ingredientsService.remove(recipeId, user.householdId, sectionId, ingredientId);
  }
}
