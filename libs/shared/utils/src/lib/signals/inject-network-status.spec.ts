import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { injectNetworkStatus } from './inject-network-status';

describe('injectNetworkStatus', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('starts with the current navigator.onLine value', () => {
    const online = TestBed.runInInjectionContext(() => injectNetworkStatus());

    expect(online()).toBe(navigator.onLine);
  });

  it('reacts to offline/online window events', () => {
    const online = TestBed.runInInjectionContext(() => injectNetworkStatus());

    window.dispatchEvent(new Event('offline'));
    expect(online()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(online()).toBe(true);
  });

  it('removes listeners when the owning injector is destroyed', () => {
    const parent = TestBed.inject(EnvironmentInjector);
    const child = createEnvironmentInjector([], parent);

    const online = runInInjectionContext(child, () => injectNetworkStatus());
    window.dispatchEvent(new Event('offline'));
    expect(online()).toBe(false);

    child.destroy();

    window.dispatchEvent(new Event('online'));
    expect(online()).toBe(false); // no update after destroy
  });

  it('accepts an explicit injector outside an injection context', () => {
    const injector = TestBed.inject(EnvironmentInjector);

    const online = injectNetworkStatus({ injector });

    window.dispatchEvent(new Event('offline'));
    expect(online()).toBe(false);
    window.dispatchEvent(new Event('online'));
    expect(online()).toBe(true);
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => injectNetworkStatus()).toThrowError(/injection context/i);
  });
});
