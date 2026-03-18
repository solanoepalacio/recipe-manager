// Wave 0 stub — covers auth redirect and UX-02
// Real assertions added in Plan 07-03 after AuthProvider is created
import { describe, it } from 'vitest';

describe('AuthProvider', () => {
  it.todo('shows skeleton while /api/auth/me is in-flight');
  it.todo('redirects to /login when /api/auth/me returns 401');
  it.todo('renders children when /api/auth/me returns 200 with user');
});
