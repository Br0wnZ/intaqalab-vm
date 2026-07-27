import '@analogjs/vitest-angular/setup-zone';
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import '@intaqalab/utils/testing/pdf-mock';
import '@testing-library/jest-dom/vitest';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
