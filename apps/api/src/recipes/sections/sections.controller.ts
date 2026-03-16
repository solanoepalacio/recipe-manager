import { Controller, Post, Patch, Delete, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('recipes')
@Controller('recipes/:id/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  // CRITICAL: reorder MUST be declared before :sectionId to avoid NestJS route collision
  @Put('reorder')
  @ApiOperation({ summary: 'Reorder sections' })
  @ApiResponse({ status: 200 })
  reorder(@Param('id') recipeId: string, @CurrentUser() user: any, @Body() dto: ReorderDto) {
    return this.sectionsService.reorder(recipeId, user.householdId, dto.ids);
  }

  @Post()
  @ApiOperation({ summary: 'Add an ingredient section' })
  @ApiResponse({ status: 201 })
  create(@Param('id') recipeId: string, @CurrentUser() user: any, @Body() dto: CreateSectionDto) {
    return this.sectionsService.create(recipeId, user.householdId, dto);
  }

  @Patch(':sectionId')
  @ApiOperation({ summary: 'Edit a section title' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id') recipeId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(recipeId, user.householdId, sectionId, dto);
  }

  @Delete(':sectionId')
  @ApiOperation({ summary: 'Delete a section and its ingredients' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id') recipeId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: any,
  ) {
    return this.sectionsService.remove(recipeId, user.householdId, sectionId);
  }
}
