import '@analogjs/vitest-angular/setup-zone';
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import '@intaqalab/utils/testing/pdf-mock';
import '@testing-library/jest-dom/vitest';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
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
