import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import '@angular/compiler';
import '@intaqalab/utils/testing/pdf-mock';
import '@testing-library/jest-dom/vitest';

setupTestBed();

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion)',
      media: query,
      onchange: null,
      addListener: () => {
        // noop
      },
      removeListener: () => {
        // noop
      },
      addEventListener: () => {
        // noop
      },
      removeEventListener: () => {
        // noop
      },
      dispatchEvent: () => false,
    }),
  });
}
