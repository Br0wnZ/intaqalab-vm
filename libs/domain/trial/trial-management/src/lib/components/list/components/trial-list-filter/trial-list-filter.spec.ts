/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TrialStatus } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialListFilter } from './trial-list-filter';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('TrialListFilter', () => {
  let fixture: ComponentFixture<TrialListFilter>;
  let detectChanges: () => void;
  let lastFilters: Record<string, unknown> | null;

  beforeEach(async () => {
    vi.clearAllMocks();

    const renderResult = await render(TrialListFilter, {
      excludeComponentDeclaration: true,
      imports: [TranslateModule.forRoot()],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
      ],
    });
    fixture = renderResult.fixture;
    detectChanges = renderResult.detectChanges;
    lastFilters = null;
    fixture.componentInstance.filtersChange.subscribe((filters: Record<string, unknown>) => (lastFilters = filters));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render and emit filter changes', async () => {
    // getByRole with name option can trigger JSDOM CSS parser crash on Angular Material selectors;
    // use getByPlaceholderText which avoids CSS selector evaluation.
    const trialNumberInput = screen.getByPlaceholderText(/TRIALS_LIST.FILTERS.TRIAL_NUMBER_PLACEHOLDER/i);

    expect(trialNumberInput).toBeTruthy();
    expect(screen.getByText('TRIALS_LIST.FILTERS.STATUS_PLACEHOLDER')).toBeTruthy();
    expect(screen.getByText('TRIALS_LIST.FILTERS.CLIENT_PLACEHOLDER')).toBeTruthy();
    expect(screen.getByText('TRIALS_LIST.FILTERS.FIRE_TRIAL_TYPE_PLACEHOLDER')).toBeTruthy();

    await fireEvent.input(trialNumberInput, { target: { value: '123' } });
    detectChanges();

    await waitFor(() => {
      expect(lastFilters).not.toBeNull();
    });
  });

  it('should render the clean filters button', () => {
    expect(screen.getByText('TRIALS_LIST.FILTERS.CLEAN_FILTERS')).toBeInTheDocument();
  });

  it('should emit filters when status is selected', async () => {
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
      expect(lastFilters).not.toBeNull();
      expect((lastFilters as any).status).toEqual([TrialStatus.UNDER_REVIEW]);
      expect((lastFilters as any).year).toBeUndefined();
    });
  });

  it('should emit multiple statuses when several are selected', async () => {
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
      expect(lastFilters).not.toBeNull();
      expect((lastFilters as any).status).toEqual([
        TrialStatus.UNDER_REVIEW,
        TrialStatus.PLANNED,
        TrialStatus.IN_PROGRESS,
      ]);
    });
  });

  it('should emit filters when client is selected', async () => {
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
      expect(lastFilters).not.toBeNull();
      expect((lastFilters as any).clientId).toBe('CLIENT-1');
    });
  });

  it('should emit filters when fireTrialTypeId is selected', async () => {
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
      expect(lastFilters).not.toBeNull();
      expect((lastFilters as any).fireTrialTypeId).toBe('FT-1');
    });
  });

  it('should emit filters with a specific year when year is selected', async () => {
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
      expect(lastFilters).not.toBeNull();
      expect((lastFilters as any).year).toBe('2025');
    });
  });

  it('should reset form and emit empty filters when reset button is clicked', async () => {
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
      expect(lastFilters).not.toBeNull();
      expect(lastFilters).toMatchObject({
        trialNumber: '',
        status: [],
        clientId: '',
        fireTrialTypeId: '',
        description: '',
      });
      expect((lastFilters as any).year).toBeUndefined();
      expect((lastFilters as any).scheduledDateFrom).toBeUndefined();
      expect((lastFilters as any).scheduledDateTo).toBeUndefined();
    });
  });
});
