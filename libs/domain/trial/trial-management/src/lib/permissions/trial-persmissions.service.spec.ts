import { TestBed } from '@angular/core/testing';

import { TrialPersmissionsService } from './trial-persmissions.service';

// vi.mock hoisted by Vitest
describe('TrialPersmissionsService', () => {
  let service: TrialPersmissionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrialPersmissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
