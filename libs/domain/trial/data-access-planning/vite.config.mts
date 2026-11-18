/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/domain/trial/data-access-planning',
  plugins: [angular({ tsconfig: './tsconfig.spec.json' })],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    fsModuleCache: false,
    name: 'trial-data-access-planning',
    watch: false,
    globals: true,
    environment: 'jsdom',
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
