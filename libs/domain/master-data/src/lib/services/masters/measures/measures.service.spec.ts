import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import type { MasterDataMeasures } from '../../../models/master-data-measures.model';
import { MeasurementsAndRecordsService } from './measures.service';

const MEASURE: MasterDataMeasures = {
  id: 'measure-1',
  unit: 'BALLISTICS',
  measurementAreaCode: 'BAL_VELOCITY',
  measurements: ['INITIAL_VELOCITY', 'TRAJECTOGRAPHY'],
  magnitudeCode: 'MUZZLE_VELOCITY',
  magnitude: { es: 'Velocidad inicial', en: 'Initial velocity' },
  measureUnit: 'M_S',
  qualificationType: 'QUANTITATIVE',
  minValue: 100,
  maxValue: 2000,
  values: [],
  equipmentTypes: ['DOPPLER_RADAR'],
  procedure: { es: 'Procedimiento', en: 'Procedure' },
  accreditation: true,
  grubbs: true,
  uncertainty: '1%',
  active: true,
};

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

  it('should send measurements as an array in the update request', () => {
    service.update(MEASURE);
    TestBed.tick();

    const request = httpMock.expectOne((candidate) => candidate.url.endsWith('/measures/measure-1'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({
      measurements: ['INITIAL_VELOCITY', 'TRAJECTOGRAPHY'],
    });
    request.flush(MEASURE);
  });
});
