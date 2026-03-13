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
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RecipeIngredientResponse } from '@recipe-manager/shared';

@ApiTags('recipes')
@Controller('recipes/:recipeId/sections/:sectionId/ingredients')
export class IngredientsController {
  constructor(private ingredientsService: IngredientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Ingredient added' })
  @ApiResponse({ status: 404, description: 'Recipe or section not found' })
  addIngredient(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateIngredientDto,
  ): Promise<RecipeIngredientResponse> {
    return this.ingredientsService.addIngredient(
      user.householdId,
      recipeId,
      sectionId,
      dto,
    );
  }

  @Patch(':ingredientId')
  @ApiResponse({ status: 200, description: 'Ingredient updated' })
  @ApiResponse({ status: 404, description: 'Recipe, section, or ingredient not found' })
  updateIngredient(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('sectionId') sectionId: string,
    @Param('ingredientId') ingredientId: string,
    @Body() dto: UpdateIngredientDto,
  ): Promise<RecipeIngredientResponse> {
    return this.ingredientsService.updateIngredient(
      user.householdId,
      recipeId,
      sectionId,
      ingredientId,
      dto,
    );
  }

  @Delete(':ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Ingredient deleted' })
  @ApiResponse({ status: 404, description: 'Recipe, section, or ingredient not found' })
  deleteIngredient(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('sectionId') sectionId: string,
    @Param('ingredientId') ingredientId: string,
  ): Promise<void> {
    return this.ingredientsService.deleteIngredient(
      user.householdId,
      recipeId,
      sectionId,
      ingredientId,
    );
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Ingredients reordered' })
  @ApiResponse({ status: 404, description: 'Recipe or section not found' })
  reorderIngredients(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: ReorderDto,
  ): Promise<void> {
    return this.ingredientsService.reorderIngredients(
      user.householdId,
      recipeId,
      sectionId,
      dto.ids,
    );
  }
}
