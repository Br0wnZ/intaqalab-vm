import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';

import { LoaderService } from './loader.service';

/** Matches the debounce delay in LoaderService */
const SHOW_DEBOUNCE_MS = 150;

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [LoaderService],
    });

    service = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    service.reset();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should start with isLoading as false', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('should set isLoading to true after the debounce delay when show() is called', fakeAsync(() => {
    service.show();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);
  }));

  it('should not show loader before the debounce delay elapses', fakeAsync(() => {
    service.show();
    tick(SHOW_DEBOUNCE_MS - 1);

    expect(service.isLoading()).toBe(false);
  }));

  it('should not show loader if hide() is called before debounce fires', fakeAsync(() => {
    service.show();
    service.hide();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(false);
  }));

  it('should set isLoading to false when hide() is called after loader is visible', fakeAsync(() => {
    service.show();
    tick(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.hide();
    tick();

    expect(service.isLoading()).toBe(false);
  }));

  it('should keep isLoading true until all show() calls are balanced by hide()', fakeAsync(() => {
    service.show();
    service.show();
    service.show();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);

    service.hide();
    tick();
    expect(service.isLoading()).toBe(true);

    service.hide();
    tick();
    expect(service.isLoading()).toBe(true);

    service.hide();
    tick();
    expect(service.isLoading()).toBe(false);
  }));

  it('should not allow the counter to go negative', fakeAsync(() => {
    service.hide();
    service.hide();
    service.hide();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(false);

    service.show();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);
  }));

  it('should reset counter to zero and hide loader when reset() is called', fakeAsync(() => {
    service.show();
    service.show();
    service.show();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);

    service.reset();
    tick();

    expect(service.isLoading()).toBe(false);
  }));

  it('should cancel a pending debounce when reset() is called before it fires', fakeAsync(() => {
    service.show();
    service.reset();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(false);
  }));

  it('should work correctly after a reset()', fakeAsync(() => {
    service.show();
    service.show();
    service.reset();

    service.show();
    tick(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);

    service.hide();
    tick();

    expect(service.isLoading()).toBe(false);
  }));

  it('should handle an alternating show/hide sequence', fakeAsync(() => {
    service.show();
    tick(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.show();
    tick(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.hide();
    tick();
    expect(service.isLoading()).toBe(true);

    service.show();
    tick(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.hide();
    service.hide();
    tick();
    expect(service.isLoading()).toBe(false);
  }));
});
