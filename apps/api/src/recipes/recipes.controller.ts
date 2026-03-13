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
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type {
  RecipeDetailResponse,
  RecipeListItemResponse,
  DuplicateRecipeResponse,
  PaginatedResponse,
} from '@recipe-manager/shared';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Paginated list of recipes' })
  listRecipes(
    @CurrentUser() user: { id: string; householdId: string },
    @Query() query: RecipeQueryDto,
  ): Promise<PaginatedResponse<RecipeListItemResponse>> {
    return this.recipesService.listRecipes(user.householdId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Created recipe' })
  createRecipe(
    @CurrentUser() user: { id: string; householdId: string },
    @Body() dto: CreateRecipeDto,
  ): Promise<RecipeDetailResponse> {
    return this.recipesService.createRecipe(user.householdId, user.id, dto);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Recipe detail' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  getRecipe(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('id') id: string,
  ): Promise<RecipeDetailResponse> {
    return this.recipesService.getRecipe(user.householdId, id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Updated recipe' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  updateRecipe(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeDetailResponse> {
    return this.recipesService.updateRecipe(user.householdId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Recipe deleted' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  deleteRecipe(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('id') id: string,
  ): Promise<void> {
    return this.recipesService.deleteRecipe(user.householdId, id);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Duplicated recipe' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  duplicateRecipe(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('id') id: string,
  ): Promise<DuplicateRecipeResponse> {
    return this.recipesService.duplicateRecipe(user.householdId, id, user.id);
  }
}
