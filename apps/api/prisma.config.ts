import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'prisma/config';

// Loaded for local prisma CLI runs (cwd is apps/api/). Absent inside Docker
// builds and in the runtime container, where env vars come from env_file.
if (existsSync('.env')) {
  loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  seed: {
    run: 'tsx prisma/seed.ts',
  },
});
