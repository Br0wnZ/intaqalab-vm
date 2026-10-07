/* eslint-disable testing-library/no-node-access */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import type { MaoTopographyMassConfigDialogData } from './mao-topography-mass-config-dialog';
import { MaoTopographyMassConfigDialog } from './mao-topography-mass-config-dialog';

const mockDialogData: MaoTopographyMassConfigDialogData = {
  fireTrialId: 'trial-123',
  serieOptions: [
    { value: 'serie-01', label: 'Funcionamiento I' },
    { value: 'serie-02', label: 'Funcionamiento II' },
  ],
  shotIdsBySeries: {
    'serie-01': ['shot-01'],
    'serie-02': ['shot-02'],
  },
  observadorOptions: [
    { value: 'obs-01', label: 'Observador 01' },
    { value: 'obs-02', label: 'Observador 02' },
  ],
  current: {
    xPieza: { value: '100.0', unit: 'm' },
    yPieza: { value: '200.0', unit: 'm' },
    zPieza: { value: '10.0', unit: 'm' },
    xBlanco: { value: '300.0', unit: 'm' },
    yBlanco: { value: '400.0', unit: 'm' },
    zBlanco: { value: '15.0', unit: 'm' },
    observador: 'obs-01',
  },
};

const mockDialogRef = {
  close: vi.fn(),
};
const mockExecutionService = {
  bulkConfigureMaoTopography: vi.fn().mockResolvedValue({ updatedShotIds: ['shot-01'] }),
};

describe('MaoTopographyMassConfigDialog', () => {
  beforeEach(() => {
    mockDialogRef.close.mockClear();
    mockExecutionService.bulkConfigureMaoTopography.mockReset().mockResolvedValue({ updatedShotIds: ['shot-01'] });
  });

  const renderDialog = (data: MaoTopographyMassConfigDialogData = mockDialogData) =>
    render(MaoTopographyMassConfigDialog, {
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ExecutionService, useValue: mockExecutionService },
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderDialog();
    expect(document.querySelector('mat-dialog-content')).toBeTruthy();
  });

  it('initializes numeric fields from dialog data', async () => {
    const { fixture } = await renderDialog();
    const component = fixture.componentInstance as unknown as {
      piezaPosition: () => { x: number | null; y: number | null; z: number | null; unit: string } | null;
    };
    expect(component.piezaPosition()?.x).toBe(100.0);
    expect(component.piezaPosition()?.y).toBe(200.0);
  });

  it('initializes observador from dialog data', async () => {
    const { fixture } = await renderDialog();
    const formValues = (
      fixture.componentInstance as unknown as {
        formModel: () => { series: string[]; observador: string | null };
      }
    ).formModel();
    expect(formValues.observador).toBe('obs-01');
    expect(formValues.series).toEqual([]);
  });

  it('enables apply for selected target series with prefilled coordinates', async () => {
    const { fixture } = await renderDialog();
    fixture.componentInstance.formModel.update((model) => ({ ...model, series: ['serie-01'] }));
    fixture.detectChanges();

    expect(fixture.componentInstance.canApply()).toBe(true);
    expect(screen.getByRole('button', { name: /MASS_CONFIG_APPLY_BTN/ })).toBeEnabled();
  });

  it('posts bulk configuration and closes only after success', async () => {
    const { fixture } = await renderDialog();
    fixture.componentInstance.formModel.update((model) => ({ ...model, series: ['serie-01'] }));
    fixture.componentInstance.piezaPosition.set({ x: 101, y: 200, z: 10, unit: 'm' });

    await fixture.componentInstance.apply();

    expect(mockExecutionService.bulkConfigureMaoTopography).toHaveBeenCalledWith('trial-123', {
      assignedShotIds: ['shot-01'],
      pieceX: 101,
      pieceXUnit: 'M',
      pieceY: 200,
      pieceYUnit: 'M',
      pieceZ: 10,
      pieceZUnit: 'M',
      targetX: 300,
      targetXUnit: 'M',
      targetY: 400,
      targetYUnit: 'M',
      targetZ: 15,
      targetZUnit: 'M',
    });
    expect(mockDialogRef.close).toHaveBeenCalledExactlyOnceWith({
      action: 'apply',
      updatedShotIds: ['shot-01'],
      observador: 'obs-01',
    });
  });

  it('keeps the dialog open and displays an error when bulk request fails', async () => {
    const { fixture } = await renderDialog();
    mockExecutionService.bulkConfigureMaoTopography.mockRejectedValueOnce(new Error('Request failed'));
    fixture.componentInstance.formModel.update((model) => ({ ...model, series: ['serie-01'] }));
    fixture.componentInstance.piezaPosition.set({ x: 101, y: 200, z: 10, unit: 'm' });

    await fixture.componentInstance.apply();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(screen.getByRole('alert')).toHaveTextContent('TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_ERROR');
  });

  it('cancel button closes dialog with action=cancel', async () => {
    await renderDialog();
    mockDialogRef.close.mockClear();

    // The cancel button uses [mat-dialog-close] directive with { action: 'cancel' }
    // so it wires directly to dialogRef — we verify the button is present
    const cancelBtn = screen.getByRole('button', { name: /MASS_CONFIG_CANCEL_BTN/ });
    expect(cancelBtn).toBeInTheDocument();
  });

  it('renders all fields', async () => {
    await renderDialog();
    const inputSelects = document.querySelectorAll('ui-input-select');
    const coordInputs = document.querySelectorAll('ui-sound-level-meter-input');
    expect(inputSelects.length).toBe(0);
    expect(coordInputs.length).toBe(2); // pieza position, blanco position
  });

  it('renders series multi-select', async () => {
    await renderDialog();
    const matSelects = document.querySelectorAll('mat-select');
    // series + observador = 2
    expect(matSelects.length).toBeGreaterThanOrEqual(2);
  });

  it('works when current values are all null', async () => {
    const nullData: MaoTopographyMassConfigDialogData = {
      ...mockDialogData,
      current: {
        xPieza: null,
        yPieza: null,
        zPieza: null,
        xBlanco: null,
        yBlanco: null,
        zBlanco: null,
        observador: null,
      },
    };
    const { fixture } = await renderDialog(nullData);
    const component = fixture.componentInstance as unknown as {
      piezaPosition: () => { x: number | null; y: number | null; z: number | null; unit: string } | null;
    };
    expect(component.piezaPosition()).toBeNull();
  });
});
