import { SetupService } from '../../src/setup/setup.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('SetupService', () => {
  let service: SetupService;
  let mockPrisma: {
    admin: { count: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      admin: {
        count: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new SetupService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('returns { required: true } when no admin exists', async () => {
      mockPrisma.admin.count.mockResolvedValue(0);

      const result = await service.getStatus();

      expect(result).toEqual({ required: true });
    });

    it('returns { required: false } when admin exists', async () => {
      mockPrisma.admin.count.mockResolvedValue(1);

      const result = await service.getStatus();

      expect(result).toEqual({ required: false });
    });
  });

  describe('createAdmin', () => {
    it('hashes password, creates admin, and returns CreateAdminResponse without passwordHash', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const createdAdmin = {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'hashed-password',
      };
      mockPrisma.admin.create.mockResolvedValue(createdAdmin);

      const result = await service.createAdmin('Admin User', 'admin@example.com', 'password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrisma.admin.create).toHaveBeenCalledWith({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          passwordHash: 'hashed-password',
        },
      });
      expect(result).toEqual({
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
