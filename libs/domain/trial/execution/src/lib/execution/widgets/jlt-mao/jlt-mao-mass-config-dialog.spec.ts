/* eslint-disable testing-library/no-node-access */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import type { JltMaoMassConfigDialogData } from './jlt-mao-mass-config-dialog';
import { JltMaoMassConfigDialog } from './jlt-mao-mass-config-dialog';

const mockDialogData: JltMaoMassConfigDialogData = {
  serieOptions: [
    { value: 'S1', label: 'Serie 1' },
    { value: 'S2', label: 'Serie 2' },
  ],
  planningConditionsReady: true,
  seriesOrientations: [
    { seriesId: 'S1', orientations: [null, null] },
    { seriesId: 'S2', orientations: [100, 100] },
  ],
  piquetaOptions: [{ value: 'P1', label: 'Piqueta 1', x: 20, y: 10 }],
  piecePosition: { x: 10, y: 10 },
  currentPiqueta: null,
  current: {
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

  it('shows the series selector', async () => {
    const { fixture } = await renderDialog();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const seriesSelect = selects[0];
    if (!seriesSelect) throw new Error('Series selector was not rendered');
    expect(await seriesSelect.isMultiple()).toBe(true);
  });

  it('cancel button closes dialog with action cancel', async () => {
    const { fixture } = await renderDialog();
    fixture.componentInstance.cancel();
    expect(closeSpy).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('apply button closes dialog with action apply and selected data', async () => {
    const { fixture } = await renderDialog();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    fixture.componentInstance['velocidadInicialField'].set({ value: '800', unit: 'm/s' });
    fixture.componentInstance.apply();
    const result = closeSpy.mock.calls[closeSpy.mock.calls.length - 1][0];
    expect(result.action).toBe('apply');
    expect(result).toHaveProperty('series');
  });

  it('formModel series starts empty', async () => {
    const { fixture } = await renderDialog();
    expect(fixture.componentInstance['formModel']().series).toEqual([]);
  });

  it('requires a target series and applicable field before applying', async () => {
    const { fixture } = await renderDialog();
    const dialog = fixture.componentInstance;

    expect(dialog['canApply']()).toBe(false);
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    expect(dialog['canApply']()).toBe(false);

    dialog['velocidadInicialField'].set({ value: '800', unit: 'm/s' });
    expect(dialog['canApply']()).toBe(true);
  });

  it('calculates OLT from piqueta and angular difference when planning has no orientation', async () => {
    const { fixture } = await renderDialog();
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S1'], piqueta: 'P1' }));
    dialog['diferenciaAngularField'].set({ value: '10', unit: 'oo' });

    expect(dialog['needsManualOrientation']()).toBe(true);
    expect(dialog['calculatedOlt']()).toBeCloseTo(10, 5);
    expect(dialog['canApply']()).toBe(true);
    dialog.apply();
    const result = closeSpy.mock.calls[closeSpy.mock.calls.length - 1][0];
    expect(result.orientation).toEqual({ seriesIds: ['S1'], lineOfFireOrientation: 10 });
  });

  it('disables orientation inputs when all shots share the same planned orientation', async () => {
    const { fixture } = await renderDialog();
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const piquetaSelect = selects[1];
    if (!piquetaSelect) throw new Error('Piqueta selector was not rendered');

    expect(dialog['needsManualOrientation']()).toBe(false);
    expect(dialog['hasInconsistentOrientation']()).toBe(false);
    expect(await piquetaSelect.isDisabled()).toBe(true);
    dialog['formModel'].update((model) => ({ ...model, series: ['S1'] }));
    fixture.detectChanges();
    expect(await piquetaSelect.isDisabled()).toBe(false);
  });

  it('blocks applying when shots in a selected series have different planned orientations', async () => {
    const { fixture } = await renderDialog({
      ...mockDialogData,
      seriesOrientations: [{ seriesId: 'S1', orientations: [100, 101] }],
    });
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S1'] }));
    dialog['velocidadInicialField'].set({ value: '800', unit: 'm/s' });

    expect(dialog['hasInconsistentOrientation']()).toBe(true);
    expect(dialog['canApply']()).toBe(false);
  });

  it('blocks applying until planning orientation data is available', async () => {
    const { fixture } = await renderDialog({ ...mockDialogData, planningConditionsReady: false });
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    dialog['velocidadInicialField'].set({ value: '800', unit: 'm/s' });

    expect(dialog['hasUnavailableOrientationData']()).toBe(true);
    expect(dialog['canApply']()).toBe(false);
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
    fixture.componentInstance['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    fixture.componentInstance.apply();
    const result = closeSpy.mock.calls[closeSpy.mock.calls.length - 1][0];
    expect(result.velocidadInicial).toEqual({ value: '800', unit: 'm/s' });
    expect(result.distanciaPique).toEqual({ value: '500', unit: 'm' });
  });
});
