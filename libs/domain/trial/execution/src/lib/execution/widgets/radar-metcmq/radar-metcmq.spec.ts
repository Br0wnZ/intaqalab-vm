/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ShotMetcmService } from '../../../data-access';
import { WidgetStateService } from '../../services/widget-state.service';
import { RadarMetcmq } from './radar-metcmq';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
  saveSuccessCount: signal(0),
};

const mockShotMetcmParams = signal<{ fireTrialId: string; seriesId: string; shotId: string } | null>(null);
const mockShotMetcmResponse = signal<{ metcmData: { blockText: string } } | undefined>(undefined);
const mockShotMetcmService = {
  shotParams: mockShotMetcmParams,
  shotMetcmResource: { value: mockShotMetcmResponse },
  isLoading: signal(false),
  error: signal<Error | null>(null),
  resetShotMetcm: vi.fn(() => {
    mockShotMetcmParams.set(null);
    mockShotMetcmResponse.set(undefined);
  }),
  loadShotMetcm: vi.fn((fireTrialId: string, seriesId: string, shotId: string) => {
    mockShotMetcmParams.set({ fireTrialId, seriesId, shotId });
    mockShotMetcmResponse.set({ metcmData: { blockText: `METCM ${shotId}` } });
  }),
};

describe('RadarMetcmq', () => {
  const renderWidget = (widgetId = 'test-radar-metcmq') =>
    render(RadarMetcmq, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        { provide: ShotMetcmService, useValue: mockShotMetcmService },
        ExecutionStore,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(screen.getByRole('heading', { name: 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.TITLE' })).toBeInTheDocument();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-radar-metcmq');
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.radarMetcmq()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).radarMetcmq();
    expect(fixture.componentInstance['formModel']().serie).toBe(stored.serie);
  });

  it('loads the METCM block automatically when selected shot changes', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    store.setFireTrialId('trial-1');
    fixture.componentInstance['formModel'].set({ serie: 'funcionamiento-1', disparo: 'disparo-1' });
    await vi.waitFor(() => expect(store.radarMetcmq().texto).toBe('METCM disparo-1'));

    expect(mockShotMetcmService.loadShotMetcm).toHaveBeenCalledWith('trial-1', 'funcionamiento-1', 'disparo-1');
    fixture.componentInstance['formModel'].set({ serie: 'funcionamiento-1', disparo: 'disparo-2' });
    await vi.waitFor(() =>
      expect(mockShotMetcmService.loadShotMetcm).toHaveBeenLastCalledWith('trial-1', 'funcionamiento-1', 'disparo-2'),
    );
    expect(store.radarMetcmq().serie).toBe('funcionamiento-1');
    expect(store.radarMetcmq().disparo).toBe('disparo-2');
  });

  it('clears the METCM block when no serie or shot is selected', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    fixture.componentInstance['formModel'].set({ serie: null, disparo: null });
    fixture.componentInstance.generateBulletin();

    expect(store.radarMetcmq().texto).toBeNull();
  });
});
