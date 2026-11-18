/// <reference types='vitest' />
import angular from '@analogjs/vite-plugin-angular';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      tsconfigPaths: true,
    },
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/intaqalab',
    plugins: [angular(), nxReadySignal()],
    define: {
      'import.meta.env.VITE_MOCKS_AUTH': JSON.stringify(process.env['VITE_MOCKS_AUTH'] ?? ''),
    },
    test: {
      fsModuleCache: false,
      name: 'intaqalab',
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
        reportsDirectory: '../../coverage/intaqalab',
        provider: 'v8' as const,
      },
    },
  };
});
