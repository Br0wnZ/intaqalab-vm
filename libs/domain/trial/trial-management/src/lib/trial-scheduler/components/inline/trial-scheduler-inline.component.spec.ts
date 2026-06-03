/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { CalendarTrialScheduleService, LinesOfShotDataService } from '@intaqalab/data-access';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialGeneralDataStore } from '../../../components/shared/+state/trial-general-data.store';
import { TrialPersmissionsService } from '../../../permissions/trial-persmissions.service';
import { TrialScheduleService } from '../../trial-schedule.service';
import { TrialSchedulerInlineComponent } from './trial-scheduler-inline.component';

// vi.mock hoisted by Vitest
describe('TrialSchedulerInlineComponent', () => {
  let mockTrialStore: any;
  let mockTrialPermissionsService: any;
  let mockCalendarTrialScheduleService: any;
  let mockLinesOfShotDataService: any;
  let mockTrialScheduleService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTrialStore = {
      setTrialId: vi.fn(),
    };

    mockTrialPermissionsService = {
      canSchedule: vi.fn(() => true),
    };

    mockCalendarTrialScheduleService = {
      getSchedule: vi.fn(async () => [{ date: '2026-06-02T12:00:00.000Z', lineOfShootId: 'line-1' }]),
      update: vi.fn(() => of(null)),
    };

    mockLinesOfShotDataService = {
      list: vi.fn(() => of([{ id: 'line-1', label: 'Línea de tiro 1' }])),
    };

    mockTrialScheduleService = {
      selectLinesAndDatesToSchedule: vi.fn(async () => true),
    };
  });

  const renderComponent = async (props = {}) => {
    const view = await render(
      `<inta-trial-scheduler-inline [trialId]="trialId" [trialStatus]="trialStatus" [trialNumber]="trialNumber"></inta-trial-scheduler-inline>`,
      {
        imports: [TrialSchedulerInlineComponent, TranslateModule.forRoot()],
        componentProperties: {
          trialId: 'TRIAL-1',
          trialStatus: 'ACTIVE',
          trialNumber: 'T-100',
          ...props,
        },
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideTestingEnvironment(),
          { provide: TrialGeneralDataStore, useValue: mockTrialStore },
          { provide: TrialPersmissionsService, useValue: mockTrialPermissionsService },
          { provide: CalendarTrialScheduleService, useValue: mockCalendarTrialScheduleService },
          { provide: LinesOfShotDataService, useValue: mockLinesOfShotDataService },
          { provide: TrialScheduleService, useValue: mockTrialScheduleService },
        ],
      },
    );

    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    return { view, loader };
  };

  it('should render component with title and manage schedule button', async () => {
    await renderComponent();

    expect(screen.getByText('TRIAL_CREATE_MODIFY_FORM.SCHEDULED_DATE')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Línea de tiro 1/)).toBeInTheDocument();
    });
  });

  it('should call manageSchedule on button click', async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Línea de tiro 1/)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockTrialScheduleService.selectLinesAndDatesToSchedule).toHaveBeenCalled();
  });

  it('should disable scheduling when canSchedule returns false', async () => {
    mockTrialPermissionsService.canSchedule.mockReturnValue(false);
    await renderComponent({ trialStatus: 'DRAFT' });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
