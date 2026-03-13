'use client';

import React from 'react';
import { UnitsManager } from '@/components/admin/UnitsManager';

export default function AdminUnitsPage() {
  return (
    <div className="px-5 py-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold text-foreground mb-6">Unidades</h2>
      <UnitsManager />
    </div>
  );
}
