import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiResponse({ status: 201, description: 'Recipe created' })
  create(@CurrentUser() user: any, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user.id, user.householdId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List, search, filter, sort, and paginate recipes in the household' })
  @ApiResponse({ status: 200, description: 'Paginated recipe list' })
  @ApiQuery({ name: 'search', required: false, description: 'Case-insensitive name substring search' })
  @ApiQuery({ name: 'foodId', required: false, description: 'Filter by food ID' })
  @ApiQuery({ name: 'sort', required: false, enum: ['name', 'createdAt', 'updatedAt', 'random'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(@CurrentUser() user: any, @Query() query: RecipeQueryDto) {
    return this.recipesService.findAll(user.householdId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recipe by UUID or slug' })
  @ApiParam({
    name: 'id',
    description: 'Recipe UUID (e.g. 550e8400-e29b-41d4-a716-446655440000) or human-readable slug (e.g. tortilla-de-patatas)',
  })
  @ApiResponse({ status: 200, description: 'Recipe detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recipesService.findOne(id, user.householdId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recipe fields' })
  @ApiResponse({ status: 200, description: 'Updated recipe' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateRecipeDto) {
    return this.recipesService.update(id, user.householdId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recipesService.remove(id, user.householdId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a recipe' })
  @ApiResponse({ status: 201, description: 'Recipe duplicated' })
  duplicate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recipesService.duplicate(id, user.householdId, user.id);
  }

}
