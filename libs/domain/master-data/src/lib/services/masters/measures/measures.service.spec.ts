import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { MeasurementsAndRecordsService } from './measures.service';

describe('MeasurementsAndRecordsService', () => {
  let service: MeasurementsAndRecordsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MeasurementsAndRecordsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
      ],
    });
    service = TestBed.inject(MeasurementsAndRecordsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and delegate to Master Data Resource Factory', () => {
    expect(service).toBeTruthy();
    expect(service.searchItems).toBeDefined();
    expect(service.paginatedResponse).toBeDefined();
    expect(service.create).toBeDefined();
    expect(service.update).toBeDefined();
    expect(service.delete).toBeDefined();
  });

  it('should send selected measurement areas as a comma-separated query parameter', () => {
    service.searchItems.set({
      page: 1,
      pageSize: 10,
      filters: { measurementAreaCode: 'INITIAL_VELOCITY,SOUND' },
    });
    TestBed.tick();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/measures'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('measurementAreaCode')).toBe('INITIAL_VELOCITY,SOUND');
    request.flush({ page: 1, pageSize: 10, totalElements: 0, items: [] });
  });
});
