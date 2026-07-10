import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { JltMaoMassConfigDialogData } from './jlt-mao-mass-config-dialog';
import { JltMaoMassConfigDialog } from './jlt-mao-mass-config-dialog';

const mockDialogData: JltMaoMassConfigDialogData = {
  serieOptions: [
    { value: 'S1', label: 'Serie 1' },
    { value: 'S2', label: 'Serie 2' },
  ],
  piquetaOptions: [{ value: 'P1', label: 'P1', x: 0, y: 0 }],
  current: {
    piqueta: null,
    velocidadInicial: null,
    distanciaPique: null,
    derivaTabular: null,
    tiempoVuelo: null,
    diferenciaAngular: null,
    anguloTiro: null,
    graduacionEspoleta: null,
    alturaFuncionamiento: null,
    distanciaFuncionamiento: null,
  },
};

describe('JltMaoMassConfigDialog', () => {
  const closeSpy = vi.fn();

  const renderDialog = (data: JltMaoMassConfigDialogData = mockDialogData) =>
    render(JltMaoMassConfigDialog, {
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderDialog();
    expect(document.querySelector('[mat-dialog-title]')).toBeTruthy();
  });

  it('shows series and piqueta mat-select elements', async () => {
    await renderDialog();
    const selects = document.querySelectorAll('mat-select');
    // series multi-select + piqueta select = at least 2
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('cancel button closes dialog with action cancel', async () => {
    const { fixture } = await renderDialog();
    fixture.componentInstance.cancel();
    expect(closeSpy).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('apply button closes dialog with action apply and selected data', async () => {
    const { fixture } = await renderDialog();
    fixture.componentInstance.apply();
    const result = closeSpy.mock.calls[closeSpy.mock.calls.length - 1][0];
    expect(result.action).toBe('apply');
    expect(result).toHaveProperty('series');
    expect(result).toHaveProperty('piqueta');
  });

  it('formModel series starts empty', async () => {
    const { fixture } = await renderDialog();
    expect(fixture.componentInstance['formModel']().series).toEqual([]);
  });

  it('formModel piqueta reflects current value from data', async () => {
    const data: JltMaoMassConfigDialogData = {
      ...mockDialogData,
      current: { ...mockDialogData.current, piqueta: 'P1' },
    };
    const { fixture } = await renderDialog(data);
    expect(fixture.componentInstance['formModel']().piqueta).toBe('P1');
  });

  it('apply includes all numeric fields in result', async () => {
    const data: JltMaoMassConfigDialogData = {
      ...mockDialogData,
      current: {
        ...mockDialogData.current,
        velocidadInicial: { value: '800', unit: 'm/s' },
        distanciaPique: { value: '500', unit: 'm' },
      },
    };
    const { fixture } = await renderDialog(data);
    fixture.componentInstance.apply();
    const result = closeSpy.mock.calls[closeSpy.mock.calls.length - 1][0];
    expect(result.velocidadInicial).toEqual({ value: '800', unit: 'm/s' });
    expect(result.distanciaPique).toEqual({ value: '500', unit: 'm' });
  });
});
