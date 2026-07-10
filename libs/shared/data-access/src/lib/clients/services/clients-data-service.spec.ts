import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { waitFor } from '@testing-library/angular';

import type { Client, ClientListResponse } from '../models/client.model';
import { ClientsDataService } from './clients-data-service';

describe('ClientsDataService', () => {
  let service: ClientsDataService;
  let httpTesting: HttpTestingController;

  const CLIENTS_URL = 'http://localhost:3000/api/clients';

  const mockItems: Client[] = [
    {
      id: 'client-001',
      name: 'RHEINMETALL EXPAL MUNITIONS',
      email: 'contacto@rheinmetall-expal.com',
      identificationDocumentTypeId: 'CIF',
      identificationDocumentId: 'A28000001J',
    },
    {
      id: 'client-002',
      name: 'Fábrica de Municiones de Granada',
      email: 'info@fmgranada.es',
      identificationDocumentTypeId: 'CIF',
      identificationDocumentId: 'Q1800001F',
    },
  ];

  const mockResponse: ClientListResponse = {
    totalElements: mockItems.length,
    items: mockItems,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), ClientsDataService],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ClientsDataService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have clientResource defined', () => {
      expect(service.clientResource).toBeDefined();
    });

    it('should have clients computed signal defined', () => {
      expect(service.clients).toBeDefined();
    });
  });

  describe('Data Loading', () => {
    it('should start with default empty state', () => {
      expect(service.clientResource.value()).toEqual({ totalElements: 0, items: [] });
      expect(service.clients()).toEqual([]);
      TestBed.tick();
      const req = httpTesting.expectOne(CLIENTS_URL);
      req.flush(mockResponse);
      TestBed.tick();
    });

    it('should load ClientListResponse and expose items via clients signal', async () => {
      service.clientResource.value();
      TestBed.tick();
      const req = httpTesting.expectOne(CLIENTS_URL);
      req.flush(mockResponse);

      await waitFor(() => {
        TestBed.tick();
        expect(service.clientResource.value()).toEqual(mockResponse);
        expect(service.clients()).toEqual(mockItems);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', async () => {
      service.clientResource.value();
      TestBed.tick();
      const req = httpTesting.expectOne(CLIENTS_URL);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      await waitFor(() => {
        TestBed.tick();
        expect(service.clientResource.error()).toBeTruthy();
      });

      expect(() => service.clientResource.value()).toThrow();
    });

    it('should handle 500 error', async () => {
      service.clientResource.value();
      TestBed.tick();
      const req = httpTesting.expectOne(CLIENTS_URL);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      await waitFor(() => {
        TestBed.tick();
        expect(service.clientResource.error()).toBeTruthy();
      });

      expect(() => service.clientResource.value()).toThrow();
    });
  });
});
