/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { MaoTopography } from './mao-topography';
import { MaoTopographyMassConfigDialog } from './mao-topography-mass-config-dialog';

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

  it('passes target context to the dialog without posting from the parent', async () => {
    const dialogResult = {
      action: 'apply' as const,
      updatedShotIds: ['shot-1'],
      observador: null,
    };
    const dialogOpen = vi.fn().mockReturnValue({ afterClosed: () => of(dialogResult) });
    const { fixture } = await render(MaoTopography, {
      inputs: { widgetId: 'test-mao-topo' },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        { provide: MatDialog, useValue: { open: dialogOpen } },
        ExecutionStore,
      ],
      imports: [TranslateModule.forRoot()],
    });
    const store = TestBed.inject(ExecutionStore);
    const executionService = TestBed.inject(ExecutionService);
    const httpMock = TestBed.inject(HttpTestingController);
    const bulkSpy = vi.spyOn(executionService, 'bulkConfigureMaoTopography');

    store.setFireTrialId('trial-123');
    TestBed.tick();
    const planningSeriesRequest = httpMock.expectOne((request) => request.url.endsWith('/planning/series'));
    planningSeriesRequest.flush([{ id: 'series-1', name: 'Serie 1', shots: [{ id: 'shot-1' }, { id: 'shot-2' }] }]);
    TestBed.tick();
    await vi.waitFor(() => expect(store.planningSeries()).toHaveLength(1));

    await fixture.componentInstance.openMassConfig();

    expect(dialogOpen).toHaveBeenCalledWith(
      MaoTopographyMassConfigDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          fireTrialId: 'trial-123',
          shotIdsBySeries: { 'series-1': ['shot-1', 'shot-2'] },
        }),
      }),
    );
    expect(bulkSpy).not.toHaveBeenCalled();
  });

  it('clears fields when the selected shot has no topography data', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const component = fixture.componentInstance as unknown as {
      formModel: () => { observador: string | null };
      piezaPosition: (() => { x: number | null; y: number | null; z: number | null; unit: string } | null) & {
        set: (value: { x: number | null; y: number | null; z: number | null; unit: string } | null) => void;
      };
    };
    vi.spyOn(execService, 'fetchShotMaoTopography').mockResolvedValue({ maoTopographyData: null });
    store.updateMaoTopography({
      observador: 'obs-01',
      xPieza: 10,
      yPieza: 20,
      zPieza: 30,
      xBlanco: 40,
      yBlanco: 50,
      zBlanco: 60,
    });
    component.piezaPosition.set({ x: 10, y: 20, z: 30, unit: 'm' });
    fixture.detectChanges();

    store.setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('s-1');
    fixture.componentInstance.onDisparoSelected('d-1');

    await vi.waitFor(() => {
      expect(store.maoTopography()).toMatchObject({
        observador: null,
        xPieza: null,
        yPieza: null,
        zPieza: null,
        xBlanco: null,
        yBlanco: null,
        zBlanco: null,
      });
    });

    expect(component.piezaPosition()).toBeNull();
    expect(component.formModel().observador).toBeNull();

    const [pieceXInput] = screen.getAllByRole<HTMLInputElement>('textbox', { name: 'X' });
    if (!pieceXInput) throw new Error('Piece X input was not rendered');
    await userEvent.setup().click(pieceXInput);
    expect(pieceXInput).toHaveValue('');
  });

  it('clears previous shot values when the selected shot GET has no response', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotMaoTopography').mockRejectedValue(new Error('No response'));
    const component = fixture.componentInstance as unknown as {
      piezaPosition: (() => { x: number | null; y: number | null; z: number | null; unit: string } | null) & {
        set: (value: { x: number | null; y: number | null; z: number | null; unit: string } | null) => void;
      };
    };
    store.updateMaoTopography({ xPieza: 10, yPieza: 20, zPieza: 30 });
    component.piezaPosition.set({ x: 10, y: 20, z: 30, unit: 'm' });
    fixture.detectChanges();
    store.setFireTrialId('trial-123');

    fixture.componentInstance.onSerieSelected('s-1');
    fixture.componentInstance.onDisparoSelected('d-1');

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('trial-123', 's-1', 'd-1'));
    await vi.waitFor(() => expect(component.piezaPosition()).toBeNull());
    expect(store.maoTopography()).toMatchObject({ xPieza: null, yPieza: null, zPieza: null });
  });
});
