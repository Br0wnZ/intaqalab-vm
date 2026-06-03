import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { injectApiUrl, provideTestingEnvironment } from '@intaqalab/config';
import { of } from 'rxjs';

import { DataTrialCreateModifyService } from './data-trial-create-modify-service';

// vi.mock hoisted by Vitest
describe('DataTrialCreateModifyService', () => {
  let serviceToTest: DataTrialCreateModifyService;
  let baseUrl: string;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    serviceToTest = TestBed.inject(DataTrialCreateModifyService);
    baseUrl = TestBed.runInInjectionContext(() => injectApiUrl());
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
});
