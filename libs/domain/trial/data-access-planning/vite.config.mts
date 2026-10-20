/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/domain/trial/data-access-planning',
  plugins: [angular({ tsconfig: './tsconfig.spec.json' }), nxViteTsPaths()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    name: 'trial-data-access-planning',
    watch: false,
    globals: true,
    environment: 'jsdom',
    deps: {
      inline: ['@angular/compiler', '@angular/common'],
    },
    server: {
      deps: {
        inline: ['@angular/compiler', '@angular/common'],
      },
    },
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/domain/trial/data-access-planning',
      provider: 'v8' as const,
    },
  },
}));
