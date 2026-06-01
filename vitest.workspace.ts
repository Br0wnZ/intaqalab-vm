// Vitest v4 workspace configuration
// IMPORTANT: point to each project's `vite.config.mts` so Vitest UI/run mode
// loads the same Angular plugin + setupFiles that Nx uses.
//
// Note: Vitest v4.0.x uses a workspace config that exports an array of project
// configurations (strings are allowed and treated as "extends" paths).
export default [
  'apps/intaqalab/vite.config.mts',
  'libs/core/vite.config.mts',
  'libs/demos/vite.config.mts',
  'libs/domain/admin/vite.config.mts',
  'libs/domain/calendar-trials/vite.config.mts',
  'libs/domain/event-log/vite.config.mts',
  'libs/domain/master-data/vite.config.mts',
  'libs/domain/trial/execution/vite.config.mts',
  'libs/domain/trial/planning/vite.config.mts',
  'libs/domain/trial/trial-management/vite.config.mts',
  'libs/domain/wharehouse-managment/vite.config.mts',
  'libs/pruebas/vite.config.mts',
  'libs/shared/config/vite.config.mts',
  'libs/shared/data-access/vite.config.mts',
  'libs/shared/models/vite.config.mts',
  'libs/shared/theme/vite.config.mts',
  'libs/shared/ui/vite.config.mts',
  'libs/shared/utils/vite.config.mts',
  'mocks/vite.config.mts',
];
