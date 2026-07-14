import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { waitForSignal } from '../testing/core/signal.helpers';
import { linkedQueryParam } from './linked-query-param';

@Component({ template: '' })
class FiltersHost {
  readonly searchTerm = linkedQueryParam('q');
  readonly page = linkedQueryParam('page', {
    parse: (raw) => (raw ? Number(raw) : 1),
    serialize: (value) => (value === 1 ? null : String(value)),
  });
}

describe('linkedQueryParam', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'filters', component: FiltersHost }])],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('reads the initial value from the URL', async () => {
    const host = await harness.navigateByUrl('/filters?q=fuze&page=3', FiltersHost);

    expect(host.searchTerm()).toBe('fuze');
    expect(host.page()).toBe(3);
  });

  it('applies parse defaults when the param is absent', async () => {
    const host = await harness.navigateByUrl('/filters', FiltersHost);

    expect(host.searchTerm()).toBeNull();
    expect(host.page()).toBe(1);
  });

  it('set() updates the signal immediately and the URL asynchronously', async () => {
    const host = await harness.navigateByUrl('/filters', FiltersHost);

    host.searchTerm.set('shell');

    expect(host.searchTerm()).toBe('shell'); // sync local write
    await waitForSignal(
      () => router.url,
      (url) => url.includes('q=shell'),
    );
  });

  it('update() works from the current value', async () => {
    const host = await harness.navigateByUrl('/filters?page=2', FiltersHost);

    host.page.update((page) => page + 1);

    expect(host.page()).toBe(3);
    await waitForSignal(
      () => router.url,
      (url) => url.includes('page=3'),
    );
  });

  it('serialize returning null removes the param from the URL', async () => {
    const host = await harness.navigateByUrl('/filters?page=5', FiltersHost);

    host.page.set(1);

    expect(host.page()).toBe(1);
    await waitForSignal(
      () => router.url,
      (url) => !url.includes('page='),
    );
  });

  it('merges with other query params instead of clobbering them', async () => {
    const host = await harness.navigateByUrl('/filters?q=fuze&page=2', FiltersHost);

    host.searchTerm.set('shell');

    await waitForSignal(
      () => router.url,
      (url) => url.includes('q=shell') && url.includes('page=2'),
    );
    expect(host.page()).toBe(2);
  });

  it('external navigation updates the signal (URL → signal)', async () => {
    const host = await harness.navigateByUrl('/filters?q=one', FiltersHost);

    await harness.navigateByUrl('/filters?q=two', FiltersHost);

    expect(host.searchTerm()).toBe('two');
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => linkedQueryParam('q')).toThrowError(/injection context/i);
  });
});
