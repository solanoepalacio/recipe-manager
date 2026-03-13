'use client';

import type { Placeholder } from '@recipe-manager/shared';

// M0.5 verification: shared types are accessible from @recipe-manager/shared
type _VerifySharedImport = Placeholder;

export default function HomePage() {
  return (
    <main>
      <h1>Recipe Manager</h1>
    </main>
  );
}
