import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [nxViteTsPaths()],
  test: {
    globals: true,
    server: {
      deps: {
        inline: [/@intaqalab\//],
      },
    },
    coverage: {
      enabled: true,
      provider: 'v8' as const,
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
    },
    projects: [
      'apps/intaqalab/vite.config.mts',
      'libs/core/vite.config.mts',
      'libs/domain/admin/vite.config.mts',
      'libs/domain/calendar-trials/vite.config.mts',
      'libs/domain/event-log/vite.config.mts',
      'libs/domain/master-data/vite.config.mts',
      // 'libs/domain/trial/execution/vite.config.mts',
      'libs/domain/trial/planning/vite.config.mts',
      'libs/domain/trial/trial-management/vite.config.mts',
      'libs/domain/wharehouse-managment/vite.config.mts',
      'libs/shared/config/vite.config.mts',
      'libs/shared/data-access/vite.config.mts',
      'libs/shared/models/vite.config.mts',
      'libs/shared/theme/vite.config.mts',
      'libs/shared/ui/vite.config.mts',
      'libs/shared/utils/vite.config.mts',
      'mocks/vite.config.mts',
    ],
  },
  server: {
    port: 51204,
  },
});
