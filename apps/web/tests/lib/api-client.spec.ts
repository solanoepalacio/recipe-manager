import { api, ApiError } from '@/lib/api-client';

const BASE_URL = 'http://localhost:3000';

describe('api-client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('api.get', () => {
    it('calls fetch with correct URL and credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1' }),
      });

      await api.get('/api/auth/me');

      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {},
        body: undefined,
      });
    });

    it('returns parsed JSON on success', async () => {
      const data = { id: '1', name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => data,
      });

      const result = await api.get('/api/auth/me');
      expect(result).toEqual(data);
    });

    it('returns undefined for 204 No Content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      });

      const result = await api.get('/api/test');
      expect(result).toBeUndefined();
    });

    it('throws ApiError on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(api.get('/api/auth/me')).rejects.toThrow(ApiError);
    });

    it('throws ApiError with correct status and body', async () => {
      const errorBody = { message: 'Unauthorized' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorBody,
      });

      try {
        await api.get('/api/auth/me');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(401);
        expect((err as ApiError).body).toEqual(errorBody);
      }
    });

    it('handles JSON parse error on error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('parse error'); },
      });

      await expect(api.get('/api/test')).rejects.toThrow(ApiError);
    });
  });

  describe('api.post', () => {
    it('calls fetch with POST method and JSON body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: '1' }),
      });

      const body = { login: 'user@test.com', password: 'secret' };
      await api.post('/api/auth/login', body);

      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });

    it('sends no Content-Type header when no body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await api.post('/api/auth/logout');

      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {},
        body: undefined,
      });
    });
  });

  describe('api.patch', () => {
    it('calls fetch with PATCH method and JSON body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1' }),
      });

      const body = { name: 'Updated Name' };
      await api.patch('/api/profile', body);

      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/profile`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });
  });

  describe('api.delete', () => {
    it('calls fetch with DELETE method', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      });

      await api.delete('/api/recipes/1');

      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/recipes/1`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {},
        body: undefined,
      });
    });
  });

  describe('ApiError', () => {
    it('is an instance of Error', () => {
      const err = new ApiError(404, { message: 'Not found' });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
    });

    it('has correct message', () => {
      const err = new ApiError(404, {});
      expect(err.message).toBe('API Error 404');
    });
  });
});
