/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TrialStatus } from '@intaqalab/models';
import { provideTranslateService } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialListFilter } from './trial-list-filter';

// vi.mock hoisted by Vitest
async function setup() {
  let lastFilters: Record<string, unknown> | null = null;
  const view = await render(TrialListFilter, {
    excludeComponentDeclaration: true,
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      provideTranslateService(),
    ],
  });
  const fixture = view.fixture;
  fixture.componentInstance.filtersChange.subscribe((filters: Record<string, unknown>) => (lastFilters = filters));
  return { view, fixture, detectChanges: view.detectChanges, getLastFilters: () => lastFilters };
}

describe('TrialListFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render and emit filter changes', async () => {
    const { detectChanges, getLastFilters } = await setup();
    // getByRole with name option can trigger JSDOM CSS parser crash on Angular Material selectors;
    // use getByPlaceholderText which avoids CSS selector evaluation.
    const trialNumberInput = screen.getByPlaceholderText(/TRIALS_LIST.FILTERS.TRIAL_NUMBER_PLACEHOLDER/i);

    expect(trialNumberInput).toBeInTheDocument();
    expect(screen.getByText('TRIALS_LIST.FILTERS.STATUS_PLACEHOLDER')).toBeInTheDocument();
    expect(screen.getByText('TRIALS_LIST.FILTERS.CLIENT_PLACEHOLDER')).toBeInTheDocument();
    expect(screen.getByText('TRIALS_LIST.FILTERS.FIRE_TRIAL_TYPE_PLACEHOLDER')).toBeInTheDocument();

    fireEvent.input(trialNumberInput, { target: { value: '123' } });
    detectChanges();

    await waitFor(() => {
      expect(getLastFilters()).not.toBeNull();
    });
  });

  it('should render the clean filters button', async () => {
    await setup();
    expect(screen.getByText('TRIALS_LIST.FILTERS.CLEAN_FILTERS')).toBeInTheDocument();
  });

  it('should emit filters when status is selected', async () => {
    const { fixture, detectChanges, getLastFilters } = await setup();
    fixture.componentInstance.formModel.set({
      trialNumber: '',
      status: [TrialStatus.UNDER_REVIEW],
      clientId: '',
      fireTrialTypeId: '',
      year: '',
      description: '',
      scheduledDateFrom: '',
      scheduledDateTo: '',
    });

    detectChanges();

    await waitFor(() => {
      expect(getLastFilters()).not.toBeNull();
      expect((getLastFilters() as any).status).toEqual([TrialStatus.UNDER_REVIEW]);
      expect((getLastFilters() as any).year).toBeUndefined();
    });
  });

  it('should emit multiple statuses when several are selected', async () => {
    const { fixture, detectChanges, getLastFilters } = await setup();
    fixture.componentInstance.formModel.set({
      trialNumber: '',
      status: [TrialStatus.UNDER_REVIEW, TrialStatus.PLANNED, TrialStatus.IN_PROGRESS],
      clientId: '',
      fireTrialTypeId: '',
      year: '',
      description: '',
      scheduledDateFrom: '',
      scheduledDateTo: '',
    });

    detectChanges();

    await waitFor(() => {
      expect(getLastFilters()).not.toBeNull();
      expect((getLastFilters() as any).status).toEqual([
        TrialStatus.UNDER_REVIEW,
        TrialStatus.PLANNED,
        TrialStatus.IN_PROGRESS,
      ]);
    });
  });

  it('should emit filters when client is selected', async () => {
    const { fixture, detectChanges, getLastFilters } = await setup();
    fixture.componentInstance.formModel.set({
      trialNumber: '',
      status: [],
      clientId: 'CLIENT-1',
      fireTrialTypeId: '',
      year: '',
      description: '',
      scheduledDateFrom: '',
      scheduledDateTo: '',
    });

    detectChanges();

    await waitFor(() => {
      expect(getLastFilters()).not.toBeNull();
      expect((getLastFilters() as any).clientId).toBe('CLIENT-1');
    });
  });

  it('should emit filters when fireTrialTypeId is selected', async () => {
    const { fixture, detectChanges, getLastFilters } = await setup();
    fixture.componentInstance.formModel.set({
      trialNumber: '',
      status: [],
      clientId: '',
      fireTrialTypeId: 'FT-1',
      year: '',
      description: '',
      scheduledDateFrom: '',
      scheduledDateTo: '',
    });

    detectChanges();

    await waitFor(() => {
      expect(getLastFilters()).not.toBeNull();
      expect((getLastFilters() as any).fireTrialTypeId).toBe('FT-1');
    });
  });

  it('should emit filters with a specific year when year is selected', async () => {
    const { fixture, detectChanges, getLastFilters } = await setup();
    fixture.componentInstance.formModel.set({
      trialNumber: '',
      status: [],
      clientId: '',
      fireTrialTypeId: '',
      year: '2025',
      description: '',
      scheduledDateFrom: '',
      scheduledDateTo: '',
    });

    detectChanges();

    await waitFor(() => {
      expect(getLastFilters()).not.toBeNull();
      expect((getLastFilters() as any).year).toBe('2025');
    });
  });

  it('should reset form and emit empty filters when reset button is clicked', async () => {
    const { fixture, detectChanges, getLastFilters } = await setup();
    fixture.componentInstance.formModel.set({
      trialNumber: '999',
      status: [TrialStatus.CANCELLED],
      clientId: 'CLIENT-XYZ',
      fireTrialTypeId: 'FT-XYZ',
      year: '2024',
      description: 'foo',
      scheduledDateFrom: '',
      scheduledDateTo: '',
    });
    detectChanges();

    fixture.componentInstance.resetForm();
    detectChanges();

    await waitFor(() => {
      expect(getLastFilters()).not.toBeNull();
      expect(getLastFilters()).toMatchObject({
        trialNumber: '',
        status: [],
        clientId: '',
        fireTrialTypeId: '',
        description: '',
      });
      expect((getLastFilters() as any).year).toBeUndefined();
      expect((getLastFilters() as any).scheduledDateFrom).toBeUndefined();
      expect((getLastFilters() as any).scheduledDateTo).toBeUndefined();
    });
  });
});
