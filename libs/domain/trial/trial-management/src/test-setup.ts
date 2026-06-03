import '@intaqalab/utils/testing/pdf-mock';
import '@analogjs/vitest-angular/setup-zone';
import { ɵsetRootDomAdapter as setRootDomAdapter } from '@angular/common';
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { ɵBrowserDomAdapter as BrowserDomAdapter } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import '@testing-library/jest-dom';

// Initialize DOM adapter BEFORE TestBed - critical for direct Vitest runs
BrowserDomAdapter.makeCurrent();
setRootDomAdapter(new BrowserDomAdapter());

const __global = globalThis as unknown as { __ANGULAR_TESTBED_INITIALIZED__?: boolean };
if (!__global.__ANGULAR_TESTBED_INITIALIZED__) {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  __global.__ANGULAR_TESTBED_INITIALIZED__ = true;
}
