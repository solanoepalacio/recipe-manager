'use client';

import type { ErrorResponse } from '@recipe-manager/shared';

// M1 verification: shared types are accessible from @recipe-manager/shared
type _VerifySharedImport = ErrorResponse;

export default function HomePage() {
  return (
    <main>
      <h1>Recipe Manager</h1>
    </main>
  );
}
