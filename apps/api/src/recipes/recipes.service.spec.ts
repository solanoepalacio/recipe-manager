// apps/api/src/recipes/recipes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  recipe: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('RecipesService', () => {
  let service: RecipesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<RecipesService>(RecipesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('generates a unique slug from recipe name', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(null); // slug available
      mockPrisma.recipe.create.mockResolvedValueOnce({
        id: 'r1',
        householdId: 'hh1',
        createdById: 'u1',
        name: 'Pasta Bolognese',
        slug: 'pasta-bolognese',
        description: null,
        servingsQty: null,
        servingsUnit: null,
        prepTime: null,
        cookTime: null,
        totalTime: null,
        performTime: null,
        sourceUrl: null,
        landscapeView: false,
        shareToken: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        sections: [],
        steps: [],
        images: [],
      });
      const result = await service.create('u1', 'hh1', { name: 'Pasta Bolognese' });
      expect(result.slug).toBe('pasta-bolognese');
      expect(result.name).toBe('Pasta Bolognese');
    });

    it('appends -2 suffix when base slug is taken', async () => {
      // First call (base slug check) returns existing record, second call (slug-2) returns null
      mockPrisma.recipe.findFirst
        .mockResolvedValueOnce({ id: 'existing' }) // base slug taken
        .mockResolvedValueOnce(null); // -2 available
      mockPrisma.recipe.create.mockResolvedValueOnce({
        id: 'r2',
        householdId: 'hh1',
        createdById: 'u1',
        name: 'Pasta Bolognese',
        slug: 'pasta-bolognese-2',
        description: null,
        servingsQty: null,
        servingsUnit: null,
        prepTime: null,
        cookTime: null,
        totalTime: null,
        performTime: null,
        sourceUrl: null,
        landscapeView: false,
        shareToken: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        sections: [],
        steps: [],
        images: [],
      });
      const result = await service.create('u1', 'hh1', { name: 'Pasta Bolognese' });
      expect(result.slug).toBe('pasta-bolognese-2');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when recipe does not exist', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('nonexistent', 'hh1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when recipe belongs to different household', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: 'r1',
        householdId: 'hh-other',
        sections: [], steps: [], images: [],
        createdAt: new Date(), updatedAt: new Date(),
      });
      await expect(service.findOne('r1', 'hh1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('throws ForbiddenException when updating recipe from different household', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: 'r1', householdId: 'hh-other',
        sections: [], steps: [], images: [],
        createdAt: new Date(), updatedAt: new Date(),
      });
      await expect(service.update('r1', 'hh1', { name: 'New' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException when deleting recipe from different household', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: 'r1', householdId: 'hh-other',
        sections: [], steps: [], images: [],
        createdAt: new Date(), updatedAt: new Date(),
      });
      await expect(service.remove('r1', 'hh1')).rejects.toThrow(ForbiddenException);
    });
  });
});
