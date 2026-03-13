'use client';

import React from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminTopBar />
      <main>{children}</main>
    </div>
  );
}
