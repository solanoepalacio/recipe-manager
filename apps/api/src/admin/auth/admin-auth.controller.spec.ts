// apps/api/src/admin/auth/admin-auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';

describe('AdminAuthController', () => {
  let controller: AdminAuthController;

  const mockAdminAuthService = {
    validateAdmin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [
        { provide: AdminAuthService, useValue: mockAdminAuthService },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminAuthController>(AdminAuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMe', () => {
    it('returns id, email, and name from the admin object', () => {
      const admin = {
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: 'should-not-be-returned',
      };

      const result = controller.getMe(admin);

      expect(result).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
