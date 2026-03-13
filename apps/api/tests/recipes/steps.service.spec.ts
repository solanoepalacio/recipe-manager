import { NotFoundException } from '@nestjs/common';
import { StepsService } from '../../src/recipes/steps/steps.service';
import type { InstructionStepResponse } from '@recipe-manager/shared';

const makeStep = (overrides = {}): InstructionStepResponse => ({
  id: 'step-1',
  title: null,
  body: 'Cook for 20 minutes',
  order: 0,
  ...overrides,
});

const makeRecipe = (overrides = {}) => ({
  id: 'recipe-1',
  householdId: 'household-1',
  ...overrides,
});

describe('StepsService', () => {
  let service: StepsService;
  let mockPrisma: {
    recipe: { findFirst: jest.Mock };
    instructionStep: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      recipe: {
        findFirst: jest.fn(),
      },
      instructionStep: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new StepsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // addStep
  // ─────────────────────────────────────────────────────────────────────────

  describe('addStep', () => {
    it('creates step with order = max + 1', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.instructionStep.findMany.mockResolvedValue([
        { order: 0 },
        { order: 1 },
      ]);
      mockPrisma.instructionStep.create.mockResolvedValue({
        id: 'step-new',
        title: null,
        body: 'New step',
        order: 2,
      });

      const result: InstructionStepResponse = await service.addStep(
        'household-1',
        'recipe-1',
        { body: 'New step' },
      );

      expect(mockPrisma.instructionStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 2 }),
        }),
      );
      expect(result.id).toBe('step-new');
      expect(result.body).toBe('New step');
    });

    it('creates step with order 0 when no existing steps', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.instructionStep.findMany.mockResolvedValue([]);
      mockPrisma.instructionStep.create.mockResolvedValue({
        id: 'step-new',
        title: null,
        body: 'First step',
        order: 0,
      });

      await service.addStep('household-1', 'recipe-1', { body: 'First step' });

      expect(mockPrisma.instructionStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 0 }),
        }),
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.addStep('household-1', 'nonexistent', { body: 'step' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for recipe in different household', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.addStep('other-household', 'recipe-1', { body: 'step' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // updateStep
  // ─────────────────────────────────────────────────────────────────────────

  describe('updateStep', () => {
    it('updates step body and returns InstructionStepResponse', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.instructionStep.findFirst.mockResolvedValue({
        id: 'step-1',
        title: null,
        body: 'Old body',
        order: 0,
        recipeId: 'recipe-1',
      });
      mockPrisma.instructionStep.update.mockResolvedValue({
        id: 'step-1',
        title: null,
        body: 'New body',
        order: 0,
      });

      const result = await service.updateStep(
        'household-1',
        'recipe-1',
        'step-1',
        { body: 'New body' },
      );

      expect(mockPrisma.instructionStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'step-1' },
          data: { body: 'New body' },
        }),
      );
      expect(result.body).toBe('New body');
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStep('hh', 'no-recipe', 'step-1', { body: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when step not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.instructionStep.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStep('household-1', 'recipe-1', 'no-step', { body: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // deleteStep
  // ─────────────────────────────────────────────────────────────────────────

  describe('deleteStep', () => {
    it('deletes step successfully', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.instructionStep.findFirst.mockResolvedValue({
        id: 'step-1',
        recipeId: 'recipe-1',
      });
      mockPrisma.instructionStep.delete.mockResolvedValue({});

      await service.deleteStep('household-1', 'recipe-1', 'step-1');

      expect(mockPrisma.instructionStep.delete).toHaveBeenCalledWith({
        where: { id: 'step-1' },
      });
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteStep('household-1', 'recipe-1', 'step-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when step not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      mockPrisma.instructionStep.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteStep('household-1', 'recipe-1', 'no-step'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // reorderSteps
  // ─────────────────────────────────────────────────────────────────────────

  describe('reorderSteps', () => {
    it('updates each step order to its index in ids array', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(makeRecipe());
      // $transaction receives an array of Prisma promises (not functions)
      mockPrisma.$transaction.mockImplementation(
        async (promises: Promise<unknown>[]) => Promise.all(promises),
      );
      mockPrisma.instructionStep.update.mockResolvedValue({});

      await service.reorderSteps('household-1', 'recipe-1', ['step-b', 'step-a']);

      expect(mockPrisma.instructionStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'step-b' }),
          data: { order: 0 },
        }),
      );
      expect(mockPrisma.instructionStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'step-a' }),
          data: { order: 1 },
        }),
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.reorderSteps('household-1', 'nonexistent', ['step-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('scopes transaction updates to the correct recipeId', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue({ id: 'r1', householdId: 'hh1' });
      mockPrisma.$transaction.mockImplementation(
        async (promises: Promise<unknown>[]) => Promise.all(promises),
      );
      mockPrisma.instructionStep.update.mockResolvedValue({});

      await service.reorderSteps('hh1', 'r1', ['st1', 'st2']);

      const calls = mockPrisma.instructionStep.update.mock.calls;
      expect(calls[0][0].where).toMatchObject({ id: 'st1', recipeId: 'r1' });
      expect(calls[1][0].where).toMatchObject({ id: 'st2', recipeId: 'r1' });
    });
  });
});
