import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  recipe: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const baseRecipe = {
  id: 'r1',
  householdId: 'hh1',
  createdById: 'u1',
  name: 'Pasta',
  slug: 'pasta',
  description: null,
  servingsQty: null,
  servingsUnit: null,
  prepTime: null,
  cookTime: null,
  totalTime: null,
  performTime: null,
  sourceUrl: null,
  shareToken: 'abc123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  sections: [],
  steps: [],
  images: [],
};

describe('SharingService', () => {
  let service: SharingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<SharingService>(SharingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('returns a 64-char hex shareToken and updates the recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      mockPrisma.recipe.update.mockResolvedValueOnce({ ...baseRecipe, shareToken: 'newtoken' });
      const result = await service.generateToken('r1', 'hh1');
      expect(result.shareToken).toMatch(/^[a-f0-9]{64}$/);
      expect(mockPrisma.recipe.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' } }),
      );
    });

    it('throws NotFoundException when recipe does not exist', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(null);
      await expect(service.generateToken('nonexistent', 'hh1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when recipe belongs to different household', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ ...baseRecipe, householdId: 'hh-other' });
      await expect(service.generateToken('r1', 'hh1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revokeToken', () => {
    it('sets shareToken to null on the recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      mockPrisma.recipe.update.mockResolvedValueOnce({ ...baseRecipe, shareToken: null });
      await service.revokeToken('r1', 'hh1');
      expect(mockPrisma.recipe.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { shareToken: null } }),
      );
    });

    it('throws ForbiddenException when recipe belongs to different household', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ ...baseRecipe, householdId: 'hh-other' });
      await expect(service.revokeToken('r1', 'hh1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByToken', () => {
    it('returns RecipeDetailResponse for a valid share token', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      const result = await service.findByToken('abc123');
      expect(result).toMatchObject({ id: 'r1', name: 'Pasta' });
    });

    it('throws NotFoundException for invalid or revoked token', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(null);
      await expect(service.findByToken('badtoken')).rejects.toThrow(NotFoundException);
    });
  });
});
