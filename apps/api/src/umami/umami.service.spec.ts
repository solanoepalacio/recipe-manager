import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { UmamiService } from './umami.service';

describe('UmamiService', () => {
  let service: UmamiService;
  let httpService: { post: jest.Mock };

  beforeEach(async () => {
    httpService = { post: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UmamiService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<UmamiService>(UmamiService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.UMAMI_URL;
    delete process.env.UMAMI_WEBSITE_ID;
    delete process.env.APP_HOSTNAME;
  });

  it('should POST correct payload to /api/send when env vars are set', () => {
    process.env.UMAMI_URL = 'http://umami.example.com:3000';
    process.env.UMAMI_WEBSITE_ID = 'test-website-id';
    process.env.APP_HOSTNAME = 'localhost';

    httpService.post.mockReturnValue(of({ data: {} }));

    service.trackEvent('share-link-view', { recipeId: 'abc', recipeName: 'Test Recipe' });

    expect(httpService.post).toHaveBeenCalledWith(
      'http://umami.example.com:3000/api/send',
      {
        type: 'event',
        payload: {
          website: 'test-website-id',
          name: 'share-link-view',
          data: { recipeId: 'abc', recipeName: 'Test Recipe' },
          url: '/shared/[token]',
          hostname: 'localhost',
        },
      },
    );
  });

  it('should NOT call httpService.post when UMAMI_URL is not set', () => {
    process.env.UMAMI_WEBSITE_ID = 'test-website-id';

    service.trackEvent('share-link-view', { recipeId: 'abc', recipeName: 'Test Recipe' });

    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('should not propagate errors when httpService.post throws', () => {
    process.env.UMAMI_URL = 'http://umami.example.com:3000';
    process.env.UMAMI_WEBSITE_ID = 'test-website-id';

    httpService.post.mockReturnValue(throwError(() => new Error('Network error')));

    expect(() => {
      service.trackEvent('share-link-view', { recipeId: 'abc', recipeName: 'Test Recipe' });
    }).not.toThrow();
  });
});
