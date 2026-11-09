import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { injectTrialStockDenominations } from './inject-trial-stock-denominations';

describe('injectTrialStockDenominations', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingEnvironment(), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('resolves trial UUID by trial number and returns unique stock denominations', async () => {
    const handle = TestBed.runInInjectionContext(() =>
      injectTrialStockDenominations({
        fireTrialId: signal('fallback-trial-id'),
        trialNumber: signal('0195/26'),
        enabled: signal(true),
      }),
    );
    await Promise.resolve();
    TestBed.tick();

    const trialRequest = httpMock.expectOne(
      (request) => request.url.endsWith('/fire-trials') && request.params.get('trialNumber') === '0195/26',
    );
    expect(trialRequest.request.params.get('page')).toBe('1');
    expect(trialRequest.request.params.get('pageSize')).toBe('200');
    trialRequest.flush({
      page: 1,
      pageSize: 200,
      totalElements: 1,
      items: [{ id: 'resolved-trial-id', trialNumber: '0195/26' }],
    });
    let stockRequest = httpMock.match((request) => request.url.endsWith('/warehouse/stock'))[0];
    await vi.waitFor(async () => {
      await Promise.resolve();
      TestBed.tick();
      stockRequest ??= httpMock.match((request) => request.url.endsWith('/warehouse/stock'))[0];
      expect(stockRequest).toBeDefined();
    });

    if (!stockRequest) throw new Error('Warehouse stock request was not queued');
    expect(stockRequest.request.params.get('plannedFireTrialIds')).toBe('resolved-trial-id');
    expect(stockRequest.request.params.get('page')).toBe('1');
    expect(stockRequest.request.params.get('pageSize')).toBe('200');
    stockRequest.flush({
      page: 1,
      pageSize: 200,
      totalElements: 2,
      items: [
        {
          id: 'stock-1',
          category: 'MUNITION_COMPONENT',
          batch: 'LOT-A',
          status: 'AVAILABLE',
          quantity: 1,
          munitionType: { id: 'type-a', name: 'Componente A' },
          denomination: { id: 'denom-a', name: 'Denominación A' },
        },
        {
          id: 'stock-2',
          category: 'MUNITION_COMPONENT',
          batch: 'LOT-B',
          status: 'AVAILABLE',
          quantity: 1,
          munitionType: { id: 'type-a', name: 'Componente A' },
          denomination: { id: 'denom-a', name: 'Denominación A' },
        },
      ],
    });
    await Promise.resolve();
    TestBed.tick();

    expect(handle.options()).toEqual([
      {
        value: 'denom-a',
        label: 'Denominación A',
        munitionTypeId: 'type-a',
        planned: false,
        inStock: true,
      },
    ]);
  });

  it('uses current trial UUID and returns no options when trial-number lookup and stock are empty', async () => {
    const handle = TestBed.runInInjectionContext(() =>
      injectTrialStockDenominations({
        fireTrialId: signal('fallback-trial-id'),
        trialNumber: signal('0195/26'),
        enabled: signal(true),
      }),
    );
    TestBed.tick();

    httpMock
      .expectOne((request) => request.url.endsWith('/fire-trials') && request.params.get('trialNumber') === '0195/26')
      .flush({ page: 1, pageSize: 200, totalElements: 0, items: [] });
    let stockRequest = httpMock.match((request) => request.url.endsWith('/warehouse/stock'))[0];
    await vi.waitFor(async () => {
      await Promise.resolve();
      TestBed.tick();
      stockRequest ??= httpMock.match((request) => request.url.endsWith('/warehouse/stock'))[0];
      expect(stockRequest).toBeDefined();
    });

    if (!stockRequest) throw new Error('Warehouse stock request was not queued');
    expect(stockRequest.request.params.get('plannedFireTrialIds')).toBe('fallback-trial-id');
    stockRequest.flush({ page: 1, pageSize: 200, totalElements: 0, items: [] });
    TestBed.tick();

    expect(handle.options()).toEqual([]);
  });
});
