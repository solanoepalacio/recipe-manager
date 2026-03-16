import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
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
  @ApiOperation({ summary: 'List all recipes in the household' })
  @ApiResponse({ status: 200, description: 'Recipe list' })
  findAll(@CurrentUser() user: any) {
    return this.recipesService.findAll(user.householdId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recipe by ID' })
  @ApiResponse({ status: 200, description: 'Recipe detail' })
  @ApiResponse({ status: 403, description: 'Access denied' })
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

}
