import '@intaqalab/utils/testing/pdf-mock';
import '@analogjs/vitest-angular/setup-zone';
import { ɵsetRootDomAdapter as setRootDomAdapter } from '@angular/common';
import { getTestBed } from '@angular/core/testing';
import { ɵBrowserDomAdapter as BrowserDomAdapter } from '@angular/platform-browser';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Initialize DOM adapter BEFORE TestBed - critical for direct Vitest runs
BrowserDomAdapter.makeCurrent();
setRootDomAdapter(new BrowserDomAdapter());

const __global = globalThis as unknown as { __ANGULAR_TESTBED_INITIALIZED__?: boolean };
if (!__global.__ANGULAR_TESTBED_INITIALIZED__) {
  getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
  __global.__ANGULAR_TESTBED_INITIALIZED__ = true;
}

afterEach(() => {
  getTestBed().resetTestingModule();
});
