// apps/api/src/recipes/sections/sections.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  recipe: { findUnique: jest.fn() },
  ingredientSection: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
};

describe('SectionsService', () => {
  let service: SectionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<SectionsService>(SectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reorder', () => {
    it('updates order field for each id by array index', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1', sections: [], steps: [], images: [], createdAt: new Date(), updatedAt: new Date() });
      mockPrisma.ingredientSection.update.mockResolvedValue({});
      await service.reorder('r1', 'hh1', ['s3', 's1', 's2']);
      expect(mockPrisma.ingredientSection.update).toHaveBeenCalledWith({ where: { id: 's3' }, data: { order: 0 } });
      expect(mockPrisma.ingredientSection.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { order: 1 } });
      expect(mockPrisma.ingredientSection.update).toHaveBeenCalledWith({ where: { id: 's2' }, data: { order: 2 } });
    });
  });
});
