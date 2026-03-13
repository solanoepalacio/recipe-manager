import { NotFoundException } from '@nestjs/common';
import { ImagesService } from '../../src/recipes/images/images.service';
import type { UploadImageResponse } from '@recipe-manager/shared';

const makeRecipe = (overrides = {}) => ({
  id: 'recipe-1',
  householdId: 'household-1',
  name: 'Test Recipe',
  ...overrides,
});

const makeImage = (overrides = {}) => ({
  id: 'img-1',
  recipeId: 'recipe-1',
  url: '/uploads/recipes/recipe-1/123.jpg',
  order: 0,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'photo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: '/uploads/recipes/recipe-1',
  filename: '123456789.jpg',
  path: '/uploads/recipes/recipe-1/123456789.jpg',
  size: 1024,
  stream: null as any,
  buffer: Buffer.from(''),
  ...overrides,
});

describe('ImagesService', () => {
  let service: ImagesService;
  let mockPrisma: {
    recipe: { findFirst: jest.Mock };
    recipeImage: {
      aggregate: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      recipe: { findFirst: jest.fn() },
      recipeImage: {
        aggregate: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new ImagesService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // uploadImage
  // ─────────────────────────────────────────────

  describe('uploadImage', () => {
    it('returns UploadImageResponse after creating DB record', async () => {
      const recipe = makeRecipe();
      const image = makeImage({ id: 'img-new', order: 1 });
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipeImage.aggregate.mockResolvedValue({ _max: { order: 0 } });
      mockPrisma.recipeImage.create.mockResolvedValue(image);

      const result: UploadImageResponse = await service.uploadImage(
        'household-1',
        'recipe-1',
        makeFile(),
      );

      expect(result.id).toBe('img-new');
      expect(result.url).toContain('/uploads/recipes/recipe-1/');
      expect(result.order).toBe(1);
    });

    it('sets order = 1 when no existing images', async () => {
      const recipe = makeRecipe();
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipeImage.aggregate.mockResolvedValue({ _max: { order: null } });
      mockPrisma.recipeImage.create.mockResolvedValue(makeImage({ order: 1 }));

      await service.uploadImage('household-1', 'recipe-1', makeFile());

      expect(mockPrisma.recipeImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 1 }),
        }),
      );
    });

    it('sets order = max + 1 when images exist', async () => {
      const recipe = makeRecipe();
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipeImage.aggregate.mockResolvedValue({ _max: { order: 5 } });
      mockPrisma.recipeImage.create.mockResolvedValue(makeImage({ order: 6 }));

      await service.uploadImage('household-1', 'recipe-1', makeFile());

      expect(mockPrisma.recipeImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 6 }),
        }),
      );
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadImage('household-1', 'recipe-1', makeFile()),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for recipe in different household', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadImage('other-household', 'recipe-1', makeFile()),
      ).rejects.toThrow(NotFoundException);
    });

    it('stores url as /uploads/recipes/<recipeId>/<filename>', async () => {
      const recipe = makeRecipe();
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipeImage.aggregate.mockResolvedValue({ _max: { order: 0 } });
      mockPrisma.recipeImage.create.mockResolvedValue(makeImage());

      await service.uploadImage('household-1', 'recipe-1', makeFile({ filename: 'abc.png' }));

      expect(mockPrisma.recipeImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: '/uploads/recipes/recipe-1/abc.png',
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // deleteImage
  // ─────────────────────────────────────────────

  describe('deleteImage', () => {
    it('deletes DB record when image exists', async () => {
      const recipe = makeRecipe();
      const image = makeImage({ id: 'img-1' });
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipeImage.findFirst.mockResolvedValue(image);
      mockPrisma.recipeImage.delete.mockResolvedValue(image);

      await service.deleteImage('household-1', 'recipe-1', 'img-1');

      expect(mockPrisma.recipeImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-1' },
      });
    });

    it('throws NotFoundException when recipe not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteImage('household-1', 'recipe-1', 'img-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when image not found', async () => {
      const recipe = makeRecipe();
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipeImage.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteImage('household-1', 'recipe-1', 'nonexistent-img'),
      ).rejects.toThrow(NotFoundException);
    });

    it('ignores file-not-found errors when deleting from disk', async () => {
      const recipe = makeRecipe();
      const image = makeImage({ url: '/uploads/recipes/recipe-1/123.jpg' });
      mockPrisma.recipe.findFirst.mockResolvedValue(recipe);
      mockPrisma.recipeImage.findFirst.mockResolvedValue(image);
      mockPrisma.recipeImage.delete.mockResolvedValue(image);

      // Should not throw even if fs.unlink fails
      await expect(
        service.deleteImage('household-1', 'recipe-1', 'img-1'),
      ).resolves.toBeUndefined();
    });
  });
});
