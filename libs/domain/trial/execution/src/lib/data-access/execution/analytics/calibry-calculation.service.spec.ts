import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CalibryCalculationService } from './calibry-calculation.service';

describe('CalibryCalculationService', () => {
  let service: CalibryCalculationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        CalibryCalculationService,
      ],
    });
    service = TestBed.inject(CalibryCalculationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts to the Calibry calculation endpoint without a request body', async () => {
    const calculation = {
      status: 'UP_TO_DATE' as const,
      calculatedAt: '2026-03-03T10:15:30Z',
      error: null,
    };
    const result = service.recalculateCalibryCalculation('trial-1');
    const request = httpTesting.expectOne(
      'http://localhost:3000/api/execution/fire-trials/trial-1/execution/calibry-calculation',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush(calculation);

    await expect(result).resolves.toEqual(calculation);
  });
});
