import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { injectDenominationBatches } from './inject-denomination-batches';

describe('injectDenominationBatches', () => {
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

  it('does not send requests when denominationId is null', () => {
    const denominationId = signal<string | null>(null);

    const handle = TestBed.runInInjectionContext(() => injectDenominationBatches({ denominationId }));

    expect(handle.options()).toEqual([]);
    httpMock.expectNone((req) => req.url.includes('/stock'));
  });

  it('fetches batches for denomination, aggregates quantity, and handles planned batch', async () => {
    const denominationId = signal<string | null>('den-1');
    const plannedBatch = signal<string | null>('LOT-PLANNED');

    const handle = TestBed.runInInjectionContext(() => injectDenominationBatches({ denominationId, plannedBatch }));
    TestBed.tick();

    const req = httpMock.expectOne((r) => r.url.includes('/stock') && r.params.get('denominationIds') === 'den-1');
    req.flush({
      items: [
        {
          id: 'stock-1',
          category: 'MUNITION',
          batch: 'LOT-A',
          quantity: 20,
          status: 'AVAILABLE',
          denomination: { id: 'den-1', name: 'Denom 1' },
        },
      ],
    });
    await Promise.resolve();
    TestBed.tick();

    const opts = handle.options();
    expect(opts).toHaveLength(2);
    // Planned batch is not in stock, so it comes with inStock=false
    expect(opts[0].value).toBe('LOT-PLANNED');
    expect(opts[0].inStock).toBe(false);
    expect(opts[0].planned).toBe(true);

    expect(opts[1].value).toBe('LOT-A');
    expect(opts[1].inStock).toBe(true);
    expect(opts[1].quantity).toBe(20);
  });
});
