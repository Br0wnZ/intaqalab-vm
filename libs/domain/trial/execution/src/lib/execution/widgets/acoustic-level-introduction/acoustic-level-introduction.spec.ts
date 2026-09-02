/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { AcousticLevelIntroduction } from './acoustic-level-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('AcousticLevelIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(AcousticLevelIntroduction, {
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
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('saveForm persists data to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.acousticLevelIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).acousticLevelIntroduction();
    expect(fixture.componentInstance['observacionesField']()).toBe(stored.observaciones);
  });

  it('calls fetchShotAcousticLevel on selection when trialId, serie and shot are present', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotAcousticLevel').mockResolvedValue({
      acousticLevelData: {
        soundLevelMeterId: 'sonometro-1',
        acousticLevel: 110.5,
      },
    });

    store.setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('s-1');
    fixture.componentInstance.onDisparoSelected('d-1');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-123', 's-1', 'd-1');
    });
  });
});
