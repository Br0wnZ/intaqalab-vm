import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { PlannedComponentData } from '../models';
import { injectComponentDenominations } from './inject-component-denominations';

describe('injectComponentDenominations', () => {
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

  it('does not send requests when munitionTypeId is null', () => {
    const munitionTypeId = signal<string | null>(null);

    const handle = TestBed.runInInjectionContext(() => injectComponentDenominations({ munitionTypeId }));

    expect(handle.options()).toEqual([]);
    httpMock.expectNone((req) => req.url.includes('/denominations'));
  });

  it('fetches denominations when munitionTypeId is set and includes planned denomination', async () => {
    const munitionTypeId = signal<string | null>('type-1');
    const planned = signal<PlannedComponentData | null>({
      denominationId: 'den-planned',
      denominationName: 'Denominación Planificada',
      batch: 'LOT-PLN',
      clientNumber: 'C-PLN',
      fuseWorkingModeId: null,
      fuseMeasurement: null,
    });

    const handle = TestBed.runInInjectionContext(() => injectComponentDenominations({ munitionTypeId, planned }));
    TestBed.tick();

    const req = httpMock.expectOne(
      (r) => r.url.includes('/denominations') && r.params.get('munitionTypeId') === 'type-1',
    );
    req.flush({
      items: [
        {
          id: 'den-stock-1',
          name: 'Denom 1 en stock',
          munitionType: { id: 'type-1', name: 'Tipo 1' },
          category: 'MUNITION',
          active: true,
        },
      ],
    });
    await Promise.resolve();
    TestBed.tick();

    const opts = handle.options();
    expect(opts).toHaveLength(2);
    // Planned should be included with inStock=false since not in items
    expect(opts[0].value).toBe('den-planned');
    expect(opts[0].inStock).toBe(false);
    expect(opts[0].planned).toBe(true);

    expect(opts[1].value).toBe('den-stock-1');
    expect(opts[1].inStock).toBe(true);
    expect(opts[1].planned).toBe(false);
  });
});
