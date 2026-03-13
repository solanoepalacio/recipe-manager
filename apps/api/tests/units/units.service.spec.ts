import { UnitsService } from '../../src/units/units.service';
import type { UnitListResponse } from '@recipe-manager/shared';

describe('UnitsService', () => {
  let service: UnitsService;
  let mockPrisma: {
    unit: { findMany: jest.Mock };
  };

  const mockUnits = [
    { id: 'unit-1', name: 'grams', abbreviation: 'g' },
    { id: 'unit-2', name: 'milliliters', abbreviation: 'ml' },
    { id: 'unit-3', name: 'pieces', abbreviation: null },
  ];

  beforeEach(() => {
    mockPrisma = {
      unit: { findMany: jest.fn() },
    };
    service = new UnitsService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUnits', () => {
    it('returns all units', async () => {
      mockPrisma.unit.findMany.mockResolvedValue(mockUnits);

      const result = await service.listUnits();

      expect(mockPrisma.unit.findMany).toHaveBeenCalledWith({});
      expect(result).toEqual<UnitListResponse>({
        items: [
          { id: 'unit-1', name: 'grams', abbreviation: 'g' },
          { id: 'unit-2', name: 'milliliters', abbreviation: 'ml' },
          { id: 'unit-3', name: 'pieces', abbreviation: null },
        ],
      });
    });

    it('returns empty items list when no units exist', async () => {
      mockPrisma.unit.findMany.mockResolvedValue([]);

      const result = await service.listUnits();

      expect(result).toEqual({ items: [] });
    });
  });
});
