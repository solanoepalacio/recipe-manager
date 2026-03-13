import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function verifyRecipe(
  prisma: PrismaService,
  householdId: string,
  recipeId: string,
) {
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, householdId },
  });
  if (!recipe) throw new NotFoundException('Recipe not found');
  return recipe;
}
