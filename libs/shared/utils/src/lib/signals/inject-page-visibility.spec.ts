import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { injectPageVisibility } from './inject-page-visibility';

function setVisibilityState(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('injectPageVisibility', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    // Restore jsdom default
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  it('starts with the current visibility', () => {
    const visible = TestBed.runInInjectionContext(() => injectPageVisibility());

    expect(visible()).toBe(true); // jsdom default: visible
  });

  it('reacts to visibilitychange events', () => {
    const visible = TestBed.runInInjectionContext(() => injectPageVisibility());

    setVisibilityState('hidden');
    expect(visible()).toBe(false);

    setVisibilityState('visible');
    expect(visible()).toBe(true);
  });

  it('removes the listener when the owning injector is destroyed', () => {
    const parent = TestBed.inject(EnvironmentInjector);
    const child = createEnvironmentInjector([], parent);
    const visible = runInInjectionContext(child, () => injectPageVisibility());

    child.destroy();

    setVisibilityState('hidden');
    expect(visible()).toBe(true); // no update after destroy
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => injectPageVisibility()).toThrowError(/injection context/i);
  });
});
