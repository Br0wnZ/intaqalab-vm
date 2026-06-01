/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/intaqalab',
    plugins: [angular(), nxViteTsPaths()],
    define: {
      'import.meta.env.VITE_MOCKS_AUTH': JSON.stringify(process.env['VITE_MOCKS_AUTH'] ?? ''),
    },
    test: {
      name: 'intaqalab',
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
        reportsDirectory: '../../coverage/intaqalab',
        provider: 'v8' as const,
      },
    },
  };
});
