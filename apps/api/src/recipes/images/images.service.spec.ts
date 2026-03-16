// apps/api/src/recipes/images/images.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ImagesService } from './images.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  recipe: { findUnique: jest.fn() },
  recipeImage: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
};

// Mock fs.promises.unlink so tests don't touch disk
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: { unlink: jest.fn().mockResolvedValue(undefined) },
  mkdirSync: jest.fn(),
}));

describe('ImagesService', () => {
  let service: ImagesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ImagesService>(ImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('stores relative URL /uploads/<filename> in DB', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1', sections: [], steps: [], images: [], createdAt: new Date(), updatedAt: new Date() });
      mockPrisma.recipeImage.aggregate.mockResolvedValueOnce({ _max: { order: null } });
      mockPrisma.recipeImage.create.mockResolvedValueOnce({
        id: 'img1', recipeId: 'r1', url: '/uploads/abc123.jpg', order: 0, createdAt: new Date(),
      });
      const file = { filename: 'abc123.jpg' } as Express.Multer.File;
      const result = await service.create('r1', 'hh1', file);
      expect(result.url).toBe('/uploads/abc123.jpg');
      expect(mockPrisma.recipeImage.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ url: '/uploads/abc123.jpg', order: 0 }) })
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when image not found for that recipe', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1', sections: [], steps: [], images: [], createdAt: new Date(), updatedAt: new Date() });
      mockPrisma.recipeImage.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove('r1', 'hh1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('deletes DB record and calls fs.promises.unlink on the file', async () => {
      const fs = await import('fs');
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1', sections: [], steps: [], images: [], createdAt: new Date(), updatedAt: new Date() });
      mockPrisma.recipeImage.findUnique.mockResolvedValueOnce({ id: 'img1', recipeId: 'r1', url: '/uploads/abc123.jpg', order: 0, createdAt: new Date() });
      mockPrisma.recipeImage.delete.mockResolvedValueOnce({});
      await service.remove('r1', 'hh1', 'img1');
      expect(mockPrisma.recipeImage.delete).toHaveBeenCalledWith({ where: { id: 'img1' } });
      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });
});
