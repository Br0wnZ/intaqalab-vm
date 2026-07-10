import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UsersService } from './users-service';
import type { PlanningUsersQueryParams, PlanningUsersResponse } from './users-service.model';

describe('UsersService', () => {
  let service: UsersService;
  let httpTesting: HttpTestingController;

  const USERS_URL = 'http://localhost:3000/api/users/users';

  const mockUsers: PlanningUsersResponse = [
    {
      id: '04f70364-0619-40a1-a22a-f2acfae77bf5',
      firstName: 'Alvaro Alonso',
      lastName: 'Alonso Juarez',
      username: 'aalojua',
    },
    {
      id: '8bf53b90-8450-4700-932c-cf3e948849ed',
      firstName: 'Alberto Alvaro',
      lastName: 'Alvaro Diaz',
      username: 'aalvdia',
    },
    {
      id: '5450ba0d-c94e-4d48-a5f6-57759dcef189',
      firstName: 'Alfredo Álvarez Pladano (Pers.',
      lastName: 'Álvarez Pladano (Pers. Externo)',
      username: 'aalvpla',
    },
  ];

  const mockUserListResponse: PlanningUsersResponse = mockUsers;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), UsersService],
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

    it('should have queryParams signal defined', () => {
      expect(service.queryParams).toBeDefined();
    });

    it('should start with null queryParams', () => {
      expect(service.queryParams()).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should not make HTTP request when queryParams is null', () => {
      // usersResource should not trigger request when params are null
      expect(service.usersResource.value()).toBeUndefined();
      httpTesting.expectNone((r) => r.url.includes('/users'));
    });

    it('should load users when queryParams is set', async () => {
      const params: PlanningUsersQueryParams = { limit: 25 };
      service.queryParams.set(params);

      TestBed.tick();
      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      expect(req.request.url).toContain('limit=25');
      req.flush(mockUserListResponse);

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.value()).toEqual(mockUserListResponse);
      });
    });

    it('should include search param when provided', () => {
      const params: PlanningUsersQueryParams = { limit: 10, search: 'admin' };
      service.queryParams.set(params);

      TestBed.tick();

      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      expect(req.request.url).toContain('limit=10');
      expect(req.request.url).toContain('search=admin');
      req.flush(mockUserListResponse);
    });

    it('should react to parameter changes', async () => {
      // First request
      service.queryParams.set({ limit: 25 });
      TestBed.tick();

      const req1 = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      expect(req1.request.url).toContain('limit=25');
      req1.flush(mockUserListResponse);

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.value()).toEqual(mockUserListResponse);
      });

      // Change params
      service.queryParams.set({ limit: 10, search: 'test' });
      TestBed.tick();

      const emptyResponse: PlanningUsersResponse = [];

      const req2 = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      expect(req2.request.url).toContain('limit=10');
      expect(req2.request.url).toContain('search=test');
      req2.flush(emptyResponse);

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.value()).toEqual(emptyResponse);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', async () => {
      service.queryParams.set({ limit: 25 });
      TestBed.tick();

      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.error()).toBeTruthy();
      });
    });

    it('should handle 500 error', async () => {
      service.queryParams.set({ limit: 25 });
      TestBed.tick();

      const req = httpTesting.expectOne((r) => r.url.startsWith(USERS_URL));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      await waitFor(() => {
        TestBed.tick();
        expect(service.usersResource.error()).toBeTruthy();
      });
    });
  });

  describe('updateFireTrialAssociatedUser', () => {
    it('should have updateFireTrialAssociatedUser resource defined', () => {
      expect(service.updateFireTrialAssociatedUser).toBeDefined();
    });

    it('should not make request when associatedPlanningUserId is null', () => {
      expect(service.associatedPlanningUserId()).toBeNull();
      httpTesting.expectNone((r) => r.url.includes('/planning-user'));
    });
  });
});
