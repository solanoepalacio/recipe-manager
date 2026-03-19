'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { AdminMeResponse } from '@recipe-manager/shared';
import { adminApi } from '@/lib/admin-api-client';

export interface AdminAuthState {
  admin: AdminMeResponse | null;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthState>({ admin: null, isLoading: true });

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get<AdminMeResponse>('/admin/auth/me')
      .then((a) => setAdmin(a))
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  return useContext(AdminAuthContext);
}
