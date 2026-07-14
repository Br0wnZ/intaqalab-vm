import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { injectQueryParams } from './inject-query-params';

@Component({ template: '' })
class SearchHost {
  readonly searchTerm = injectQueryParams('q');
  readonly allQueryParams = injectQueryParams();
}

describe('injectQueryParams', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'search', component: SearchHost }])],
    });
  });

  it('exposes a query param as signal', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/search?q=fuze', SearchHost);

    expect(host.searchTerm()).toBe('fuze');
  });

  it('updates on query-param-only navigation', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/search?q=fuze', SearchHost);

    await harness.navigateByUrl('/search?q=shell', SearchHost);

    expect(host.searchTerm()).toBe('shell');
  });

  it('returns null when the param is absent', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/search', SearchHost);

    expect(host.searchTerm()).toBeNull();
  });

  it('returns all query params when called without key', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/search?q=abc&page=2', SearchHost);

    expect(host.allQueryParams()).toEqual({ q: 'abc', page: '2' });
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => injectQueryParams('q')).toThrowError(/injection context/i);
  });
});
