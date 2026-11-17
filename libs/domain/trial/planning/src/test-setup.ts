import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { ɵsetRootDomAdapter as setRootDomAdapter } from '@angular/common';
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { ɵBrowserDomAdapter as BrowserDomAdapter } from '@angular/platform-browser';
import '@intaqalab/utils/testing/pdf-mock';
import { provideTranslateService } from '@ngx-translate/core';
import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// Initialize DOM adapter BEFORE TestBed - critical for direct Vitest runs
BrowserDomAdapter.makeCurrent();
setRootDomAdapter(new BrowserDomAdapter());

setupTestBed();

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideTranslateService()],
  });
});

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
