import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';

import { TrialPersmissionsService } from './trial-persmissions.service';

// vi.mock hoisted by Vitest
describe('TrialPersmissionsService', () => {
  let service: TrialPersmissionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { userRoles: signal(['INTAQALAB_ADMIN']) },
        },
      ],
    });
    service = TestBed.inject(TrialPersmissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return true for canSchedule on allowed trial statuses when user has schedule role', () => {
    const allowedStatuses = [
      TrialStatus.UNDER_REVIEW,
      TrialStatus.PLANNED,
      TrialStatus.IN_PROGRESS,
      TrialStatus.INTERRUPTED,
      TrialStatus.STARTED,
    ];

    allowedStatuses.forEach((status) => {
      expect(service.canSchedule(status)).toBe(true);
    });
  });

  it('should return false for canSchedule on unallowed trial status', () => {
    const unallowedStatuses = [
      TrialStatus.PREPARED,
      TrialStatus.EXECUTED,
      TrialStatus.ANALYZING,
      TrialStatus.FINALIZING,
      TrialStatus.CLOSED,
      TrialStatus.CANCELLED,
      TrialStatus.VOIDED,
    ];

    unallowedStatuses.forEach((status) => {
      expect(service.canSchedule(status)).toBe(false);
    });
  });
});
