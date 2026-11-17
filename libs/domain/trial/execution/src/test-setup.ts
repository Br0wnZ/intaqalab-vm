import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { ɵsetRootDomAdapter as setRootDomAdapter } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import '@angular/compiler';
import { ɵBrowserDomAdapter as BrowserDomAdapter } from '@angular/platform-browser';
import '@intaqalab/utils/testing/pdf-mock';
import '@testing-library/jest-dom/vitest';

registerLocaleData(localeEs);

// Initialize DOM adapter BEFORE TestBed - critical for direct Vitest runs
BrowserDomAdapter.makeCurrent();
setRootDomAdapter(new BrowserDomAdapter());

setupTestBed();

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {
      // noop
    }
    unobserve(): void {
      // noop
    }
    disconnect(): void {
      // noop
    }
  };
}

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
