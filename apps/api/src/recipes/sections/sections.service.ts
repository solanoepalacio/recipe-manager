import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyRecipeOwnership(recipeId: string, householdId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    return recipe;
  }

  async create(recipeId: string, householdId: string, dto: CreateSectionDto) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const maxOrder = await this.prisma.ingredientSection.aggregate({
      where: { recipeId },
      _max: { order: true },
    });
    return this.prisma.ingredientSection.create({
      data: {
        recipeId,
        title: dto.title ?? null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async update(recipeId: string, householdId: string, sectionId: string, dto: UpdateSectionDto) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const section = await this.prisma.ingredientSection.findUnique({ where: { id: sectionId } });
    if (!section || section.recipeId !== recipeId) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }
    return this.prisma.ingredientSection.update({
      where: { id: sectionId },
      data: { ...(dto.title !== undefined && { title: dto.title }) },
    });
  }

  async remove(recipeId: string, householdId: string, sectionId: string) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const section = await this.prisma.ingredientSection.findUnique({ where: { id: sectionId } });
    if (!section || section.recipeId !== recipeId) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }
    await this.prisma.ingredientSection.delete({ where: { id: sectionId } });
    return { id: sectionId };
  }

  async reorder(recipeId: string, householdId: string, ids: string[]): Promise<void> {
    await this.verifyRecipeOwnership(recipeId, householdId);
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.ingredientSection.update({ where: { id }, data: { order: index } }),
      ),
    );
  }
}
