import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { injectApiUrl, provideTestingEnvironment } from '@intaqalab/config';
import { of } from 'rxjs';

import { DataTrialCreateModifyService } from './data-trial-create-modify-service';

// vi.mock hoisted by Vitest
describe('DataTrialCreateModifyService', () => {
  let serviceToTest: DataTrialCreateModifyService;
  let baseUrl: string;
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    serviceToTest = TestBed.inject(DataTrialCreateModifyService);
    baseUrl = TestBed.runInInjectionContext(() => injectApiUrl());
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('loadtrial should call to /trials', () => {
    const get = vi.fn().mockReturnValue(of(null));
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const mockHttp: any = {
      get,
    };
    serviceToTest.httpClient = mockHttp;
    const id = '1';
    serviceToTest.loadTrial(id);
    expect(get).toHaveBeenCalledWith(`${baseUrl}/fire-trials/${id}`);
  });

  it('exports filtered trials as an Excel blob without pagination parameters', () => {
    serviceToTest.exportFireTrials(
      {
        trialNumber: '0001/26',
        description: 'calibration',
        status: [],
        clientId: '',
        fireTrialTypeId: '',
      },
      ['createdAt;desc'],
    );
    TestBed.tick();

    const request = httpTestingController.expectOne(
      (candidate) =>
        candidate.url === `${serviceToTest.url}/xlsx` &&
        candidate.params.get('trialNumber') === '0001/26' &&
        candidate.params.get('description') === 'calibration',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.params.has('page')).toBe(false);
    expect(request.request.params.has('pageSize')).toBe(false);
    expect(request.request.params.getAll('sort')).toEqual(['createdAt;desc']);
    request.flush(new Blob(['xlsx']));
  });
});
