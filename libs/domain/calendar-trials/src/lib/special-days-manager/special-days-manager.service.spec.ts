import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { SpecialDaysManagerService } from './special-days-manager.service';

describe('SpecialDaysManagerService', () => {
  let service: SpecialDaysManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(SpecialDaysManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
