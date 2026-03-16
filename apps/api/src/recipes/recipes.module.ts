import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { SectionsController } from './sections/sections.controller';
import { SectionsService } from './sections/sections.service';
import { IngredientsController } from './ingredients/ingredients.controller';
import { IngredientsService } from './ingredients/ingredients.service';

@Module({
  controllers: [RecipesController, SectionsController, IngredientsController],
  providers: [RecipesService, SectionsService, IngredientsService],
  exports: [RecipesService],
})
export class RecipesModule {}
