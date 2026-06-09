/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideTestingEnvironment } from '@intaqalab/config';
import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { RadarMetcmq } from './radar-metcmq';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
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
        ExecutionStore,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
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

  it('generateBulletin sets texto when serie and disparo are selected', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    fixture.componentInstance['formModel'].set({ serie: 'funcionamiento-1', disparo: 'disparo-1' });
    fixture.componentInstance.generateBulletin();

    expect(store.radarMetcmq().texto).toBeTruthy();
    expect(store.radarMetcmq().serie).toBe('funcionamiento-1');
    expect(store.radarMetcmq().disparo).toBe('disparo-1');
  });

  it('generateBulletin sets texto to null when no serie/disparo selected', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    fixture.componentInstance['formModel'].set({ serie: null, disparo: null });
    fixture.componentInstance.generateBulletin();

    expect(store.radarMetcmq().texto).toBeNull();
  });
});
