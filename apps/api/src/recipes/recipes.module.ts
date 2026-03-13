import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { SectionsController } from './sections/sections.controller';
import { SectionsService } from './sections/sections.service';
import { IngredientsController } from './ingredients/ingredients.controller';
import { IngredientsService } from './ingredients/ingredients.service';
import { StepsController } from './steps/steps.controller';
import { StepsService } from './steps/steps.service';
import { ImagesController } from './images/images.controller';
import { ImagesService } from './images/images.service';
import { SharingController } from './sharing/sharing.controller';
import { SharedRecipeController } from './sharing/shared-recipe.controller';
import { SharingService } from './sharing/sharing.service';

@Module({
  controllers: [
    // SharedRecipeController must come BEFORE RecipesController to avoid
    // the /recipes/shared/:token route being shadowed by /recipes/:id
    SharedRecipeController,
    RecipesController,
    SectionsController,
    IngredientsController,
    StepsController,
    ImagesController,
    SharingController,
  ],
  providers: [
    RecipesService,
    SectionsService,
    IngredientsService,
    StepsService,
    ImagesService,
    SharingService,
  ],
  exports: [RecipesService],
})
export class RecipesModule {}
