-- DropForeignKey
ALTER TABLE "IngredientSection" DROP CONSTRAINT "IngredientSection_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT "RecipeIngredient_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "InstructionStep" DROP CONSTRAINT "InstructionStep_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeImage" DROP CONSTRAINT "RecipeImage_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "MealPlanEntry" DROP CONSTRAINT "MealPlanEntry_recipeId_fkey";

-- AddForeignKey (with CASCADE)
ALTER TABLE "IngredientSection" ADD CONSTRAINT "IngredientSection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (with CASCADE)
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "IngredientSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (with CASCADE)
ALTER TABLE "InstructionStep" ADD CONSTRAINT "InstructionStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (with CASCADE)
ALTER TABLE "RecipeImage" ADD CONSTRAINT "RecipeImage_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (with CASCADE)
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
