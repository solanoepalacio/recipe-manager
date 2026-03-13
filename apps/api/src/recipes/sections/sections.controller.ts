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
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { IngredientSectionResponse } from '@recipe-manager/shared';

@ApiTags('recipes')
@Controller('recipes/:recipeId/sections')
export class SectionsController {
  constructor(private sectionsService: SectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Section added' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  addSection(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Body() dto: CreateSectionDto,
  ): Promise<IngredientSectionResponse> {
    return this.sectionsService.addSection(user.householdId, recipeId, dto);
  }

  @Patch(':sectionId')
  @ApiResponse({ status: 200, description: 'Section updated' })
  @ApiResponse({ status: 404, description: 'Recipe or section not found' })
  updateSection(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ): Promise<IngredientSectionResponse> {
    return this.sectionsService.updateSection(
      user.householdId,
      recipeId,
      sectionId,
      dto,
    );
  }

  @Delete(':sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Section deleted' })
  @ApiResponse({ status: 404, description: 'Recipe or section not found' })
  deleteSection(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('sectionId') sectionId: string,
  ): Promise<void> {
    return this.sectionsService.deleteSection(
      user.householdId,
      recipeId,
      sectionId,
    );
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Sections reordered' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  reorderSections(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Body() dto: ReorderDto,
  ): Promise<void> {
    return this.sectionsService.reorderSections(
      user.householdId,
      recipeId,
      dto.ids,
    );
  }
}
