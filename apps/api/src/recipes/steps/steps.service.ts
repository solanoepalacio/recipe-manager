import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyRecipe } from '../helpers/verify-recipe.helper';
import type {
  InstructionStepResponse,
  CreateStepRequest,
  UpdateStepRequest,
} from '@recipe-manager/shared';

@Injectable()
export class StepsService {
  constructor(private prisma: PrismaService) {}

  private toStepResponse(step: {
    id: string;
    title: string | null;
    body: string;
    order: number;
  }): InstructionStepResponse {
    return {
      id: step.id,
      title: step.title,
      body: step.body,
      order: step.order,
    };
  }

  async addStep(
    householdId: string,
    recipeId: string,
    dto: CreateStepRequest,
  ): Promise<InstructionStepResponse> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    const existing = await this.prisma.instructionStep.findMany({
      where: { recipeId },
      select: { order: true },
    });

    const maxOrder =
      existing.length > 0 ? Math.max(...existing.map((s) => s.order)) : -1;

    const step = await this.prisma.instructionStep.create({
      data: {
        recipeId,
        title: dto.title ?? null,
        body: dto.body,
        order: maxOrder + 1,
      },
    });

    return this.toStepResponse(step);
  }

  async updateStep(
    householdId: string,
    recipeId: string,
    stepId: string,
    dto: UpdateStepRequest,
  ): Promise<InstructionStepResponse> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    const step = await this.prisma.instructionStep.findFirst({
      where: { id: stepId, recipeId },
    });
    if (!step) throw new NotFoundException('Step not found');

    const updated = await this.prisma.instructionStep.update({
      where: { id: stepId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
      },
    });

    return this.toStepResponse(updated);
  }

  async deleteStep(
    householdId: string,
    recipeId: string,
    stepId: string,
  ): Promise<void> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    const step = await this.prisma.instructionStep.findFirst({
      where: { id: stepId, recipeId },
    });
    if (!step) throw new NotFoundException('Step not found');

    await this.prisma.instructionStep.delete({ where: { id: stepId } });
  }

  async reorderSteps(
    householdId: string,
    recipeId: string,
    ids: string[],
  ): Promise<void> {
    await verifyRecipe(this.prisma, householdId, recipeId);

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.instructionStep.update({
          where: { id, recipeId },
          data: { order: index },
        }),
      ),
    );
  }
}
