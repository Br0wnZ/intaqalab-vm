import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { LoaderService } from './loader.service';

/** Matches the debounce delay in LoaderService */
const SHOW_DEBOUNCE_MS = 150;

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [LoaderService],
    });

    service = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    service.reset();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should start with isLoading as false', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('should set isLoading to true after the debounce delay when show() is called', async () => {
    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);
  });

  it('should not show loader before the debounce delay elapses', async () => {
    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS - 1);

    expect(service.isLoading()).toBe(false);
  });

  it('should not show loader if hide() is called before debounce fires', async () => {
    service.show();
    service.hide();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(false);
  });

  it('should set isLoading to false when hide() is called after loader is visible', async () => {
    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.hide();
    await vi.advanceTimersByTimeAsync(0);

    expect(service.isLoading()).toBe(false);
  });

  it('should keep isLoading true until all show() calls are balanced by hide()', async () => {
    service.show();
    service.show();
    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);

    service.hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(service.isLoading()).toBe(true);

    service.hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(service.isLoading()).toBe(true);

    service.hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(service.isLoading()).toBe(false);
  });

  it('should not allow the counter to go negative', async () => {
    service.hide();
    service.hide();
    service.hide();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(false);

    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);
  });

  it('should reset counter to zero and hide loader when reset() is called', async () => {
    service.show();
    service.show();
    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);

    service.reset();
    await vi.advanceTimersByTimeAsync(0);

    expect(service.isLoading()).toBe(false);
  });

  it('should cancel a pending debounce when reset() is called before it fires', async () => {
    service.show();
    service.reset();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(false);
  });

  it('should work correctly after a reset()', async () => {
    service.show();
    service.show();
    service.reset();

    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

    expect(service.isLoading()).toBe(true);

    service.hide();
    await vi.advanceTimersByTimeAsync(0);

    expect(service.isLoading()).toBe(false);
  });

  it('should handle an alternating show/hide sequence', async () => {
    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(service.isLoading()).toBe(true);

    service.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    expect(service.isLoading()).toBe(true);

    service.hide();
    service.hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(service.isLoading()).toBe(false);
  });
});
