'use client';

import React from 'react';
import { FoodsManager } from '@/components/admin/FoodsManager';

export default function AdminFoodsPage() {
  return (
    <div className="px-5 py-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold text-foreground mb-6">Alimentos</h2>
      <FoodsManager />
    </div>
  );
}
