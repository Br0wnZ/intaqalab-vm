import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShotMetcmService } from './shot-metcm.service';

describe('ShotMetcmService', () => {
  let service: ShotMetcmService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingEnvironment(), provideHttpClient(), provideHttpClientTesting(), ShotMetcmService],
    });
    service = TestBed.inject(ShotMetcmService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the associated active METCM document and then fetches the block', async () => {
    service.loadShotMetcm('trial-1', 'series-1', 'shot-1');
    TestBed.tick();

    const documentsRequest = httpTesting.expectOne(
      (req) =>
        req.url === 'http://localhost:3000/api/documents/fire-trials/trial-1/documents' &&
        req.params.get('typeId') === 'd8869239-caee-4c21-a462-ad538b9d84cd' &&
        req.params.get('status') === 'ACTIVE' &&
        req.params.get('pageSize') === '200',
    );
    expect(documentsRequest.request.method).toBe('GET');
    documentsRequest.flush({
      page: 1,
      pageSize: 1,
      totalElements: 1,
      items: [
        {
          id: '7c2d1a90-4b3e-4f21-9a8c-1d5e6f7a8b90',
          type: { id: 'd8869239-caee-4c21-a462-ad538b9d84cd' },
          status: 'ACTIVE',
        },
      ],
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const metcmRequest = httpTesting.expectOne(
      (req) =>
        req.url ===
          'http://localhost:3000/api/execution/fire-trials/trial-1/execution/metcm/series/series-1/shots/shot-1' &&
        req.params.get('documentId') === '7c2d1a90-4b3e-4f21-9a8c-1d5e6f7a8b90',
    );
    expect(metcmRequest.request.method).toBe('GET');
    metcmRequest.flush({ metcmData: { blockText: 'METCM line 1\nMETCM line 2\n' } });
    await vi.waitFor(() =>
      expect(service.shotMetcmResource.value()?.metcmData.blockText).toBe('METCM line 1\nMETCM line 2\n'),
    );
  });

  it('reports an error when the trial has no active METCM document', async () => {
    service.loadShotMetcm('trial-1', 'series-1', 'shot-1');
    TestBed.tick();
    httpTesting
      .expectOne((req) => req.url.includes('/documents/fire-trials/trial-1/documents'))
      .flush({
        page: 1,
        pageSize: 0,
        totalElements: 0,
        items: [],
      });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    expect(service.error()?.message).toBe('Active METCM document not found for fire trial');
    httpTesting.expectNone((req) => req.url.includes('/execution/metcm/'));
  });
});
