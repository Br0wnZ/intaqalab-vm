/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/domain/calendar-trials',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  resolve: {
    alias: {
      positioning: fileURLToPath(new URL('./src/test-stubs/positioning.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['positioning'],
  },
  ssr: {
    noExternal: true as const,
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    name: 'domain-calendar-trials',
    watch: false,
    globals: true,
    environment: 'jsdom',
    deps: {
      inline: ['@angular/compiler', '@angular/common', 'angular-calendar', 'positioning'],
    },
    server: {
      deps: {
        inline: ['@angular/compiler', '@angular/common', 'angular-calendar', 'positioning'],
      },
    },
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/domain/calendar-trials',
      provider: 'v8' as const,
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
}));
