'use client';
import { AdminPanelLayout } from '@/components/admin/AdminPanelLayout';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
