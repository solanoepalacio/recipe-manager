import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MealPlanService } from './meal-plan.service';
import { PrismaService } from '../prisma/prisma.service';
import { MealType } from '@recipe-manager/shared';

const mockPrisma = {
  mealPlan: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  mealPlanEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recipe: {
    findUnique: jest.fn(),
  },
};

const baseEntry = {
  id: 'e1',
  mealPlanId: 'mp1',
  recipeId: 'r1',
  date: new Date('2026-01-06'),
  mealType: MealType.Dinner,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  recipe: { id: 'r1', name: 'Pasta', slug: 'pasta' },
  mealPlan: { id: 'mp1', householdId: 'hh1' },
};

describe('MealPlanService', () => {
  let service: MealPlanService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlanService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<MealPlanService>(MealPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEntry', () => {
    it('creates an entry and lazy-creates the MealPlan via upsert', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1' });
      mockPrisma.mealPlan.upsert.mockResolvedValueOnce({ id: 'mp1', householdId: 'hh1' });
      mockPrisma.mealPlanEntry.create.mockResolvedValueOnce(baseEntry);
      const result = await service.createEntry('hh1', {
        recipeId: 'r1', date: '2026-01-06', mealType: MealType.Dinner,
      });
      expect(mockPrisma.mealPlan.upsert).toHaveBeenCalledWith({
        where: { householdId: 'hh1' },
        create: { householdId: 'hh1' },
        update: {},
      });
      expect(result).toMatchObject({ id: 'e1', mealType: MealType.Dinner, recipeId: 'r1' });
    });

    it('returns MealPlanEntryResponse with recipeName and recipeSlug', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1' });
      mockPrisma.mealPlan.upsert.mockResolvedValueOnce({ id: 'mp1', householdId: 'hh1' });
      mockPrisma.mealPlanEntry.create.mockResolvedValueOnce(baseEntry);
      const result = await service.createEntry('hh1', {
        recipeId: 'r1', date: '2026-01-06', mealType: MealType.Dinner,
      });
      expect(result.recipeName).toBe('Pasta');
      expect(result.recipeSlug).toBe('pasta');
    });
  });

  describe('getEntries', () => {
    it('returns empty entries array when no MealPlan exists for the household', async () => {
      mockPrisma.mealPlan.findUnique.mockResolvedValueOnce(null);
      const result = await service.getEntries('hh1');
      expect(result).toEqual({ entries: [] });
    });

    it('returns entries for the household meal plan', async () => {
      mockPrisma.mealPlan.findUnique.mockResolvedValueOnce({ id: 'mp1', householdId: 'hh1' });
      mockPrisma.mealPlanEntry.findMany.mockResolvedValueOnce([baseEntry]);
      const result = await service.getEntries('hh1');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('e1');
    });

    it('applies date range filter when from and to provided', async () => {
      mockPrisma.mealPlan.findUnique.mockResolvedValueOnce({ id: 'mp1' });
      mockPrisma.mealPlanEntry.findMany.mockResolvedValueOnce([]);
      await service.getEntries('hh1', '2026-01-01', '2026-01-07');
      expect(mockPrisma.mealPlanEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: new Date('2026-01-01'), lte: new Date('2026-01-07') },
          }),
        }),
      );
    });
  });

  describe('updateEntry', () => {
    it('updates the entry when it belongs to the caller household', async () => {
      mockPrisma.mealPlanEntry.findUnique.mockResolvedValueOnce(baseEntry);
      mockPrisma.mealPlanEntry.update.mockResolvedValueOnce({ ...baseEntry, mealType: MealType.Lunch });
      const result = await service.updateEntry('e1', 'hh1', { mealType: MealType.Lunch });
      expect(mockPrisma.mealPlanEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'e1' } }),
      );
      expect(result.mealType).toBe(MealType.Lunch);
    });

    it('throws ForbiddenException when entry belongs to different household', async () => {
      mockPrisma.mealPlanEntry.findUnique.mockResolvedValueOnce({
        ...baseEntry, mealPlan: { id: 'mp2', householdId: 'hh-other' },
      });
      await expect(service.updateEntry('e1', 'hh1', { mealType: MealType.Lunch }))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when entry does not exist', async () => {
      mockPrisma.mealPlanEntry.findUnique.mockResolvedValueOnce(null);
      await expect(service.updateEntry('nonexistent', 'hh1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEntry', () => {
    it('deletes the entry when it belongs to the caller household', async () => {
      mockPrisma.mealPlanEntry.findUnique.mockResolvedValueOnce(baseEntry);
      mockPrisma.mealPlanEntry.delete.mockResolvedValueOnce(baseEntry);
      await service.deleteEntry('e1', 'hh1');
      expect(mockPrisma.mealPlanEntry.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });

    it('throws ForbiddenException when entry belongs to different household', async () => {
      mockPrisma.mealPlanEntry.findUnique.mockResolvedValueOnce({
        ...baseEntry, mealPlan: { id: 'mp2', householdId: 'hh-other' },
      });
      await expect(service.deleteEntry('e1', 'hh1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when entry does not exist', async () => {
      mockPrisma.mealPlanEntry.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteEntry('nonexistent', 'hh1')).rejects.toThrow(NotFoundException);
    });
  });
});
