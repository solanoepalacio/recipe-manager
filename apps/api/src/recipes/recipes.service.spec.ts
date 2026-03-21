// apps/api/src/recipes/recipes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecipesService } from './recipes.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  $transaction: jest.fn(),
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
    jest.resetAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
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
    const defaultSectionMock = { id: 'sec1', title: null, order: 0, ingredients: [] };

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
        sections: [defaultSectionMock],
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
        sections: [defaultSectionMock],
        steps: [],
        images: [],
      });
      const result = await service.create('u1', 'hh1', { name: 'Pasta Bolognese' });
      expect(result.slug).toBe('pasta-bolognese-2');
    });

    it('creates a default ingredient section with null title', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(null); // slug available
      mockPrisma.recipe.create.mockResolvedValueOnce({
        id: 'r1',
        householdId: 'hh1',
        createdById: 'u1',
        name: 'Test Recipe',
        slug: 'test-recipe',
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
        sections: [defaultSectionMock],
        steps: [],
        images: [],
      });
      const result = await service.create('u1', 'hh1', { name: 'Test Recipe' });
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBeNull();
      expect(result.sections[0].order).toBe(0);
      expect(result.sections[0].ingredients).toHaveLength(0);
      // Verify the create call included nested section create
      expect(mockPrisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sections: { create: [{ title: null, order: 0 }] },
          }),
        }),
      );
    });
  });

  describe('create -- compound', () => {
    const defaultSectionMock = { id: 'sec1', title: null, order: 0, ingredients: [] };

    it('passes ingredients to nested section create and steps to recipe create', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(null);
      mockPrisma.recipe.create.mockResolvedValueOnce({
        id: 'r1', householdId: 'hh1', createdById: 'u1',
        name: 'Compound Recipe', slug: 'compound-recipe',
        description: null, servingsQty: null, servingsUnit: null,
        prepTime: null, cookTime: null, totalTime: null, performTime: null,
        sourceUrl: null, shareToken: null, isLocked: false,
        createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
        sections: [{ id: 'sec1', title: null, order: 0, ingredients: [
          { id: 'ing1', foodId: 'f1', food: { name: 'Tomate' }, unitId: 'u1', unit: { name: 'gramo' }, quantity: { toNumber: () => 100 }, note: null, order: 0 },
        ] }],
        steps: [{ id: 'st1', title: null, body: 'Cortar', order: 0 }],
        images: [],
      });

      const result = await service.create('u1', 'hh1', {
        name: 'Compound Recipe',
        ingredients: [{ foodId: 'f1', unitId: 'u1', quantity: 100 }],
        steps: [{ body: 'Cortar' }],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      const createCall = mockPrisma.recipe.create.mock.calls[0][0];
      expect(createCall.data.sections.create[0].ingredients.create).toHaveLength(1);
      expect(createCall.data.sections.create[0].ingredients.create[0].foodId).toBe('f1');
      expect(createCall.data.steps.create).toHaveLength(1);
      expect(createCall.data.steps.create[0].body).toBe('Cortar');
      expect(result.sections[0].ingredients).toHaveLength(1);
      expect(result.steps).toHaveLength(1);
    });

    it('empty arrays behave same as no arrays', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(null);
      mockPrisma.recipe.create.mockResolvedValueOnce({
        id: 'r2', householdId: 'hh1', createdById: 'u1',
        name: 'Simple', slug: 'simple',
        description: null, servingsQty: null, servingsUnit: null,
        prepTime: null, cookTime: null, totalTime: null, performTime: null,
        sourceUrl: null, shareToken: null, isLocked: false,
        createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
        sections: [{ id: 'sec1', title: null, order: 0, ingredients: [] }],
        steps: [], images: [],
      });

      await service.create('u1', 'hh1', { name: 'Simple', ingredients: [], steps: [] });

      const createCall = mockPrisma.recipe.create.mock.calls[0][0];
      expect(createCall.data.sections.create[0].ingredients).toBeUndefined();
      expect(createCall.data.steps).toBeUndefined();
    });

    it('throws BadRequestException on P2003 FK error', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(null);
      const fkError = new Error('FK constraint') as any;
      fkError.code = 'P2003';
      Object.setPrototypeOf(fkError, Prisma.PrismaClientKnownRequestError.prototype);
      mockPrisma.$transaction.mockRejectedValueOnce(fkError);

      await expect(
        service.create('u1', 'hh1', {
          name: 'Bad Recipe',
          ingredients: [{ foodId: 'nonexistent' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when recipe does not exist', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('nonexistent', 'hh1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when recipe belongs to different household (cross-household 404)', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({
        id: '550e8400-e29b-41d4-a716-446655440000',
        householdId: 'hh-other',
        sections: [], steps: [], images: [],
        createdAt: new Date(), updatedAt: new Date(),
      });
      await expect(service.findOne('550e8400-e29b-41d4-a716-446655440000', 'hh1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne — dual lookup', () => {
    const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
    const baseRecipe = {
      id: VALID_UUID,
      householdId: 'hh1',
      createdById: 'u1',
      name: 'Tortilla de Patatas',
      slug: 'tortilla-de-patatas',
      description: null,
      servingsQty: null,
      servingsUnit: null,
      prepTime: null,
      cookTime: null,
      totalTime: null,
      performTime: null,
      sourceUrl: null,
      shareToken: null,
      isLocked: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      sections: [],
      steps: [],
      images: [],
    };

    it('UUID path: calls findUnique and returns RecipeDetailResponse', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce(baseRecipe);
      const result = await service.findOne(VALID_UUID, 'hh1');
      expect(mockPrisma.recipe.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: VALID_UUID }, include: expect.any(Object) }),
      );
      expect(result.id).toBe(VALID_UUID);
      expect(result.slug).toBe('tortilla-de-patatas');
    });

    it('UUID cross-household: throws NotFoundException (not ForbiddenException)', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ ...baseRecipe, householdId: 'hh-other' });
      const rejection = service.findOne(VALID_UUID, 'hh1');
      await expect(rejection).rejects.toThrow(NotFoundException);
      await expect(rejection).rejects.not.toThrow(ForbiddenException);
    });

    it('UUID not found: throws NotFoundException', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(null);
      await expect(service.findOne(VALID_UUID, 'hh1')).rejects.toThrow(NotFoundException);
    });

    it('slug path: calls findFirst with householdId + slug', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(baseRecipe);
      const result = await service.findOne('tortilla-de-patatas', 'hh1');
      expect(mockPrisma.recipe.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { householdId: 'hh1', slug: 'tortilla-de-patatas' },
          include: expect.any(Object),
        }),
      );
      expect(result.id).toBe(VALID_UUID);
    });

    it('slug not found: throws NotFoundException', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(null);
      await expect(service.findOne('tortilla-de-patatas', 'hh1')).rejects.toThrow(NotFoundException);
    });

    it('ambiguous string (not UUID format): calls findFirst (not findUnique)', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValueOnce(baseRecipe);
      await service.findOne('abc123', 'hh1');
      expect(mockPrisma.recipe.findFirst).toHaveBeenCalled();
      expect(mockPrisma.recipe.findUnique).not.toHaveBeenCalled();
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
