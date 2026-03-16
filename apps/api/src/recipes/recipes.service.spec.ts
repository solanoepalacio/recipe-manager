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
    count: jest.fn(),
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

  describe('findAll', () => {
    const baseRecipe = {
      id: 'r1', name: 'Pasta Carbonara', slug: 'pasta-carbonara',
      description: null, servingsQty: null, servingsUnit: null, shareToken: null,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
      _count: { images: 2 },
    };

    it('returns PaginatedResponse shape with defaults (page=1, pageSize=20, sort=createdAt, order=desc)', async () => {
      mockPrisma.recipe.findMany.mockResolvedValueOnce([baseRecipe]);
      mockPrisma.recipe.count.mockResolvedValueOnce(1);
      const result = await service.findAll('hh1', {});
      expect(result).toMatchObject({ items: expect.any(Array), total: 1, page: 1, perPage: 20 });
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      }));
    });

    it('filters by name when search param provided', async () => {
      mockPrisma.recipe.findMany.mockResolvedValueOnce([baseRecipe]);
      mockPrisma.recipe.count.mockResolvedValueOnce(1);
      await service.findAll('hh1', { search: 'pasta' });
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ name: { contains: 'pasta', mode: 'insensitive' } }),
      }));
    });

    it('filters by foodId when foodId param provided', async () => {
      mockPrisma.recipe.findMany.mockResolvedValueOnce([baseRecipe]);
      mockPrisma.recipe.count.mockResolvedValueOnce(1);
      await service.findAll('hh1', { foodId: 'food-uuid' });
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          sections: { some: { ingredients: { some: { foodId: 'food-uuid' } } } },
        }),
      }));
    });

    it('applies sort=name, order=asc to orderBy', async () => {
      mockPrisma.recipe.findMany.mockResolvedValueOnce([baseRecipe]);
      mockPrisma.recipe.count.mockResolvedValueOnce(1);
      await service.findAll('hh1', { sort: 'name' as any, order: 'asc' as any });
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { name: 'asc' },
      }));
    });

    it('applies pagination: page=2, pageSize=5 → skip=5, take=5', async () => {
      mockPrisma.recipe.findMany.mockResolvedValueOnce([baseRecipe]);
      mockPrisma.recipe.count.mockResolvedValueOnce(10);
      const result = await service.findAll('hh1', { page: 2, pageSize: 5 });
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 5,
        take: 5,
      }));
      expect(result.perPage).toBe(5);
      expect(result.page).toBe(2);
    });

    it('handles sort=random by fetching all IDs and returning shuffled slice', async () => {
      // First findMany call (fetch IDs), second findMany call (fetch data for page IDs)
      mockPrisma.recipe.findMany
        .mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }])
        .mockResolvedValueOnce([baseRecipe]);
      const result = await service.findAll('hh1', { sort: 'random' as any });
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(1);
    });

    it('maps recipe to RecipeListItem shape including imageCount', async () => {
      mockPrisma.recipe.findMany.mockResolvedValueOnce([baseRecipe]);
      mockPrisma.recipe.count.mockResolvedValueOnce(1);
      const result = await service.findAll('hh1', {});
      expect(result.items[0]).toMatchObject({
        id: 'r1', name: 'Pasta Carbonara', imageCount: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });
});
