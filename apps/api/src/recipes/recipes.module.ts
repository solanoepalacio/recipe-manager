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
import { SharingController, SharedController } from './sharing/sharing.controller';
import { SharingService } from './sharing/sharing.service';

@Module({
  controllers: [
    RecipesController,
    SectionsController,
    IngredientsController,
    StepsController,
    ImagesController,
    SharingController,
    SharedController,
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
