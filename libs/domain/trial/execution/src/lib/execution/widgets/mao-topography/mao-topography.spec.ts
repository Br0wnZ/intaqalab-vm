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
import { MaoTopography } from './mao-topography';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('MaoTopography', () => {
  const renderWidget = (widgetId = 'test-mao-topo') =>
    render(MaoTopography, {
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
    const state = fixture.componentInstance.formState();
    expect(state.dirty).toBe(false);
    expect(state.touched).toBe(false);
    expect(state.hasChanges).toBe(false);
  });

  it('formState reports the correct widgetId', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().widgetId).toBe('test-mao-topo');
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    const stored = store.maoTopography();
    expect(stored).toBeDefined();
    expect(stored.serie).toBeNull();
    expect(stored.disparo).toBeNull();
    expect(stored.observador).toBeNull();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateMaoTopography({ observador: 'obs-01' });

    fixture.componentInstance.resetForm();

    const formValues = (
      fixture.componentInstance as unknown as {
        formModel: () => { observador: string | null };
      }
    ).formModel();
    expect(formValues.observador).toBe('obs-01');
  });

  it('numeric fields default to null when store has no data', async () => {
    const { fixture } = await renderWidget();
    const component = fixture.componentInstance as unknown as {
      piezaPosition: () => { x: number | null; y: number | null; z: number | null; unit: string } | null;
    };
    expect(component.piezaPosition()).toBeNull();
  });

  it('maoTopographyDistanciaBocaBlanco is null without full coords', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    expect(store.maoTopographyDistanciaBocaBlanco()).toBeNull();
  });

  it('maoTopographyDistanciaBocaBlanco computes distance when all coords are set', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateMaoTopography({
      xPieza: 0,
      yPieza: 0,
      zPieza: 0,
      xBlanco: 3,
      yBlanco: 4,
      zBlanco: 0,
    });
    // sqrt(3² + 4² + 0²) = 5
    expect(store.maoTopographyDistanciaBocaBlanco()).toBe(5);
  });

  it('calls fetchShotMaoTopography on selection when trialId, serie and shot are present', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotMaoTopography').mockResolvedValue({
      maoTopographyData: {
        pieceX: 10,
        pieceY: 20,
        pieceZ: 30,
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
