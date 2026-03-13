import { ProfileController } from '../../src/profile/profile.controller';
import { ProfileService } from '../../src/profile/profile.service';
import type { ProfileResponse } from '@recipe-manager/shared';

describe('ProfileController', () => {
  let controller: ProfileController;
  let mockService: {
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };

  const mockUser = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    username: 'alice',
    passwordHash: 'hashed-password',
    gender: 'female',
    dateOfBirth: new Date('1990-06-15'),
    householdId: 'hh-1',
  };

  const mockProfileResponse: ProfileResponse = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    username: 'alice',
    gender: 'female' as any,
    dateOfBirth: '1990-06-15',
    householdId: 'hh-1',
  };

  beforeEach(() => {
    mockService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };
    controller = new ProfileController(mockService as unknown as ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /profile', () => {
    it('calls service.getProfile with user id and returns result', async () => {
      mockService.getProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.getProfile(mockUser as any);

      expect(mockService.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockProfileResponse);
    });
  });

  describe('PATCH /profile', () => {
    it('calls service.updateProfile with user id and dto and returns result', async () => {
      const updatedProfile = { ...mockProfileResponse, name: 'Alice Updated' };
      mockService.updateProfile.mockResolvedValue(updatedProfile);
      const dto = { name: 'Alice Updated' };

      const result = await controller.updateProfile(mockUser as any, dto);

      expect(mockService.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(updatedProfile);
    });
  });
});
