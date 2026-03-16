// apps/api/src/recipes/steps/steps.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StepsService } from './steps.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  recipe: { findUnique: jest.fn() },
  instructionStep: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
};

describe('StepsService', () => {
  let service: StepsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<StepsService>(StepsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reorder', () => {
    it('updates order for each step id by array index', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1', sections: [], steps: [], images: [], createdAt: new Date(), updatedAt: new Date() });
      mockPrisma.instructionStep.update.mockResolvedValue({});
      await service.reorder('r1', 'hh1', ['st2', 'st1', 'st3']);
      expect(mockPrisma.instructionStep.update).toHaveBeenCalledWith({ where: { id: 'st2' }, data: { order: 0 } });
      expect(mockPrisma.instructionStep.update).toHaveBeenCalledWith({ where: { id: 'st1' }, data: { order: 1 } });
    });
  });
});
