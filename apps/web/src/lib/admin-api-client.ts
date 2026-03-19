import { api } from './api-client';

async function adminRequest<T>(
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  body?: unknown,
): Promise<T> {
  try {
    if (body !== undefined) {
      return await (api[method] as <R>(p: string, b: unknown) => Promise<R>)<T>(path, body);
    }
    return await (api[method] as <R>(p: string) => Promise<R>)<T>(path);
  } catch (err: unknown) {
    if (typeof window !== 'undefined' && (err as { status?: number }).status === 401) {
      window.location.replace('/admin/login');
      return new Promise<T>(() => {}); // never resolves — redirect pending
    }
    throw err;
  }
}

export const adminApi = {
  get:    <T>(path: string)                => adminRequest<T>('get', path),
  post:   <T>(path: string, body: unknown) => adminRequest<T>('post', path, body),
  patch:  <T>(path: string, body: unknown) => adminRequest<T>('patch', path, body),
  put:    <T>(path: string, body: unknown) => adminRequest<T>('put', path, body),
  delete: <T>(path: string)                => adminRequest<T>('delete', path),
};
