import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { createMockPlanningGeneralDataStore, createTrial } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { FeaturePlanningGeneralDataShellComponent } from './feature-planning-general-data-shell.component';

describe('FeaturePlanningGeneralDataShellComponent', () => {
  const planningInfoFixture = {
    goal: 'Goal',
    specimens: [{ specimenId: 'specimen-1', batch: '' }],
    planningUser: { id: 'user-1', fullname: 'User One' },
    observations: 'Observations',
    requirements: 'Requirements',
    additionalInfo: 'Additional info',
    dateControl: {
      maxEmissionDates: 10,
      percentageTechnicalUnits: 40,
      percentageEndTrial: 60,
      daysSignReport: 5,
    },
  };

  const runSetup = async (overrides?: Parameters<typeof createMockPlanningGeneralDataStore>[0]) => {
    const mockStore = createMockPlanningGeneralDataStore({
      fireTrial: { ...createTrial(), status: 'PLANNED' },
      fireTrialId: 'trial-123',
      ...overrides,
    });

    const view = await render(FeaturePlanningGeneralDataShellComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideTestingEnvironment(),
        { provide: AuthService, useValue: { userRoles: signal(['INTAQALAB_ADMIN']) } },
      ],
      componentProviders: [{ provide: PlanningGeneralDataStore, useValue: mockStore }],
    });

    return { view, mockStore };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the component', async () => {
    const { view } = await runSetup();
    expect(view.fixture.componentInstance).toBeTruthy();
  }, 15000);

  it('should render the tabs navigation', async () => {
    await runSetup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('should render the general data tab', async () => {
    await runSetup();
    expect(screen.getByRole('tab', { name: /TRIAL_PLANNING.GENERAL_DATA_SECTION.TAB_TITLE/i })).toBeInTheDocument();
  });

  it('should keep shooting conditions tab disabled when there are no series with shots', async () => {
    await runSetup({
      planningInfo: planningInfoFixture,
      series: [{ shotQuantity: 0, shots: [] }],
    });

    expect(screen.getByRole('tab', { name: /TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('should enable shooting conditions tab when there is at least one series with shots', async () => {
    await runSetup({
      planningInfo: planningInfoFixture,
      series: [{ shotQuantity: 1, shots: [{ id: 'shot-1' }] }],
    });

    expect(screen.getByRole('tab', { name: /TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE/i })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });
});
