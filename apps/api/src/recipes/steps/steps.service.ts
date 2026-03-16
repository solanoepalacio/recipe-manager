import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';

@Injectable()
export class StepsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyRecipeOwnership(recipeId: string, householdId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    return recipe;
  }

  async create(recipeId: string, householdId: string, dto: CreateStepDto) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const maxOrder = await this.prisma.instructionStep.aggregate({
      where: { recipeId },
      _max: { order: true },
    });
    return this.prisma.instructionStep.create({
      data: {
        recipeId,
        title: dto.title ?? null,
        body: dto.body,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async update(recipeId: string, householdId: string, stepId: string, dto: UpdateStepDto) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const step = await this.prisma.instructionStep.findUnique({ where: { id: stepId } });
    if (!step || step.recipeId !== recipeId) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }
    return this.prisma.instructionStep.update({
      where: { id: stepId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
      },
    });
  }

  async remove(recipeId: string, householdId: string, stepId: string) {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const step = await this.prisma.instructionStep.findUnique({ where: { id: stepId } });
    if (!step || step.recipeId !== recipeId) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }
    await this.prisma.instructionStep.delete({ where: { id: stepId } });
    return { id: stepId };
  }

  async reorder(recipeId: string, householdId: string, ids: string[]): Promise<void> {
    await this.verifyRecipeOwnership(recipeId, householdId);
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.instructionStep.update({ where: { id }, data: { order: index } }),
      ),
    );
  }
}
