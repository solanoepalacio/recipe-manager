'use client';
import { AuthProvider } from '@/lib/auth';

// Wrap auth routes in AuthProvider so LoginPage can detect already-authenticated sessions
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
