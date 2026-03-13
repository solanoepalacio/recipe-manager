import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: {
    user: { findFirst: jest.Mock };
  };

  const mockUser = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    username: 'alice',
    passwordHash: 'hashed-password',
    householdId: 'hh-1',
  };

  beforeEach(() => {
    mockPrisma = {
      user: { findFirst: jest.fn() },
    };

    service = new AuthService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns user when credentials are valid (email login)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('alice@example.com', 'correct-password');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          passwordHash: { not: null },
          OR: [{ email: 'alice@example.com' }, { username: 'alice@example.com' }],
        },
      });
    });

    it('returns user when credentials are valid (username login)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('alice', 'correct-password');

      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('alice@example.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.validateUser('unknown@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user has no password (cannot login)', async () => {
      const userWithoutPassword = { ...mockUser, passwordHash: null };
      mockPrisma.user.findFirst.mockResolvedValue(userWithoutPassword);

      await expect(service.validateUser('alice@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('toLoginResponse', () => {
    it('maps user to LoginResponse correctly', () => {
      const result = service.toLoginResponse(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        username: mockUser.username,
        householdId: mockUser.householdId,
      });
    });

    it('handles null email and username', () => {
      const userWithNulls = { ...mockUser, email: null, username: null };
      const result = service.toLoginResponse(userWithNulls);

      expect(result.email).toBeNull();
      expect(result.username).toBeNull();
    });
  });

  describe('toMeResponse', () => {
    it('maps user to MeResponse correctly', () => {
      const result = service.toMeResponse(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        username: mockUser.username,
        householdId: mockUser.householdId,
      });
    });

    it('handles null email and username', () => {
      const userWithNulls = { ...mockUser, email: null, username: null };
      const result = service.toMeResponse(userWithNulls);

      expect(result.email).toBeNull();
      expect(result.username).toBeNull();
    });
  });
});
