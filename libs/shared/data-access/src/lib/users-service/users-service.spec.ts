import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { waitFor } from '@testing-library/dom';
import { beforeEach, describe, expect, it, afterEach } from 'vitest';

import type { User, UserListResponse } from './users-service.model';
import { UsersService } from './users-service';

describe('UsersService', () => {
  let service: UsersService;
  let httpTesting: HttpTestingController;

  const USERS_URL = 'http://localhost:3000/api/users';

  const mockUsers: User[] = [
    {
      id: 'b01a0e23-da71-3a08-9893-11b8b2dfb069',
      username: 'Usuario CET 1',
      roles: ['SYSTEM_ADMIN'],
    },
    {
      id: 'd6d77053-92bc-3af6-b332-8bea8c4c6904',
      username: 'Usuario CET 2',
      roles: ['ADMINISTRATIVE'],
    },
  ];

  const mockResponse: UserListResponse = {
    page: 1,
    pageSize: 25,
    totalElements: mockUsers.length,
    items: mockUsers,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        UsersService,
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UsersService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have usersResource defined', () => {
      expect(service.usersResource).toBeDefined();
    });

    it('should have users computed signal defined', () => {
      expect(service.users).toBeDefined();
    });
  });

  describe('Data Loading', () => {
    it('should start with default empty state', () => {
      expect(service.usersResource.value()).toEqual({ page: 1, pageSize: 25, totalElements: 0, items: [] });
      expect(service.users()).toEqual([]);
      TestBed.tick();
      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      req.flush(mockResponse);
      TestBed.tick();
    });

    it('should load UserListResponse and expose items via users signal', async () => {
      service.usersResource.value();
      TestBed.tick();
      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('25');
      req.flush(mockResponse);

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.value()).toEqual(mockResponse);
        expect(service.users()).toEqual(mockUsers);
        expect(service.totalElements()).toBe(2);
      });
    });

    it('should react to parameter changes when load() is called', async () => {
      service.usersResource.value();
      TestBed.tick();
      const req1 = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      req1.flush(mockResponse);

      await waitFor(() => {
        TestBed.tick();
        expect(service.users()).toEqual(mockUsers);
      });

      service.load({ page: 2, pageSize: 10 });
      TestBed.tick();

      const req2 = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      expect(req2.request.params.get('page')).toBe('2');
      expect(req2.request.params.get('pageSize')).toBe('10');

      const page2Response: UserListResponse = {
        page: 2,
        pageSize: 10,
        totalElements: 12,
        items: [],
      };
      req2.flush(page2Response);

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.value()).toEqual(page2Response);
        expect(service.users()).toEqual([]);
        expect(service.totalElements()).toBe(12);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', async () => {
      service.usersResource.value();
      TestBed.tick();
      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.error()).toBeTruthy();
        expect(service.hasError()).toBe(true);
        expect(service.users()).toEqual([]);
        expect(service.totalElements()).toBe(0);
      });
    });

    it('should handle 500 error', async () => {
      service.usersResource.value();
      TestBed.tick();
      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.error()).toBeTruthy();
        expect(service.hasError()).toBe(true);
        expect(service.users()).toEqual([]);
        expect(service.totalElements()).toBe(0);
      });
    });
  });
});
