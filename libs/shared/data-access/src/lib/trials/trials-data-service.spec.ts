import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { FireTrial, UpsertFireTrial } from '@intaqalab/models';

import { TrialsDataService } from './trials-data-service';

describe('TrialsDataService', () => {
  let service: TrialsDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), TrialsDataService],
    });
    service = TestBed.inject(TrialsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not make request if year is missing', () => {
    service.search({ clientId: '123', content: 'test' });
    httpMock.expectNone((r) => r.url.includes('/fire-trials'));
  });

  it('should create trial and make HTTP POST request', async () => {
    const centerId = 'center-123';
    const createData: UpsertFireTrial = {
      name: 'Test Trial',
    } as unknown as UpsertFireTrial;
    const mockResponse: FireTrial = {
      id: 'trial-456',
      centerId,
      name: 'Test Trial',
    } as unknown as FireTrial;

    service.createTrial(createData);

    TestBed.tick();

    const req = httpMock.expectOne((r) => r.url.includes('/fire-trials'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createData);

    req.flush(mockResponse);
  });
});
