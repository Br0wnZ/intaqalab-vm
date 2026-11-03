/* eslint-disable testing-library/no-node-access */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ɵɵdefineDirective } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AngleUnitEnum } from '@intaqalab/models';
import { InputSelect, InputSelectInput, IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import type { JltMaoMassConfigDialogData } from './jlt-mao-mass-config-dialog';
import { JltMaoMassConfigDialog } from './jlt-mao-mass-config-dialog';

if (!(InputSelectInput as unknown as { ɵdir?: unknown }).ɵdir) {
  (InputSelectInput as unknown as { ɵdir: unknown }).ɵdir = ɵɵdefineDirective({
    type: InputSelectInput,
    selectors: [['input', 'inputSelectInput', '']],
    standalone: true,
  });
}

const intaIconCmp = (IntaIconComponent as unknown as { ɵcmp?: { inputs?: Record<string, [string, number, null]> } })
  .ɵcmp;
if (intaIconCmp) {
  intaIconCmp.inputs = {
    ...intaIconCmp.inputs,
    name: ['name', 1, null],
    color: ['color', 1, null],
    size: ['size', 1, null],
  };
}

const inputSelectCmp = (
  InputSelect as unknown as {
    ɵcmp?: {
      inputs?: Record<string, [string, number, null]>;
    };
  }
).ɵcmp;
if (inputSelectCmp) {
  inputSelectCmp.inputs = {
    ...inputSelectCmp.inputs,
    label: ['label', 1, null],
    opciones: ['opciones', 1, null],
    textColor: ['textColor', 1, null],
    placeholder: ['placeholder', 1, null],
    readOnly: ['readOnly', 1, null],
    readonly: ['readOnly', 1, null],
    unitDisabled: ['unitDisabled', 1, null],
    numericSign: ['numericSign', 1, null],
    decimals: ['decimals', 1, null],
    minDecimals: ['minDecimals', 1, null],
    variant: ['variant', 1, null],
    showLabel: ['showLabel', 1, null],
    floatLabel: ['floatLabel', 1, null],
    value: ['value', 1, null],
  };
}

const localeDecimalDir = (
  LocaleDecimalInputDirective as unknown as {
    ɵdir?: { inputs?: Record<string, [string, number, null]> };
  }
).ɵdir;
if (localeDecimalDir) {
  localeDecimalDir.inputs = {
    ...localeDecimalDir.inputs,
    decimals: ['decimals', 1, null],
    minDecimals: ['minDecimals', 1, null],
    numericSign: ['numericSign', 1, null],
    decimalValue: ['decimalValue', 1, null],
  };
}

const mockDialogData: JltMaoMassConfigDialogData = {
  serieOptions: [
    { value: 'S1', label: 'Serie 1' },
    { value: 'S2', label: 'Serie 2' },
  ],
  planningConditionsReady: true,
  planningConfigurationsReady: true,
  seriesConfigurations: [
    { seriesId: 'S1', signature: 'same-configuration' },
    { seriesId: 'S2', signature: 'same-configuration' },
  ],
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

  it('disables series with different configurations and blocks incompatible programmatic selection', async () => {
    const { fixture } = await renderDialog({
      ...mockDialogData,
      seriesConfigurations: [
        { seriesId: 'S1', signature: 'configuration-1' },
        { seriesId: 'S2', signature: 'configuration-2' },
      ],
    });
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S1'] }));
    expect(dialog['serieSelectOptions']().find((option) => option.value === 'S2')?.disabled).toBe(true);

    dialog['formModel'].update((model) => ({ ...model, series: ['S1', 'S2'] }));
    dialog['velocidadInicialField'].set({ value: '800', unit: 'm/s' });
    expect(dialog['hasIncompatibleSeriesConfigurations']()).toBe(true);
    expect(dialog['canApply']()).toBe(false);
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
    const piquetaSelect = selects[2];
    if (!piquetaSelect) throw new Error('Piqueta selector was not rendered');

    expect(dialog['needsManualOrientation']()).toBe(false);
    expect(dialog['hasInconsistentOrientation']()).toBe(false);
    expect(await piquetaSelect.isDisabled()).toBe(true);
    dialog['formModel'].update((model) => ({ ...model, series: ['S1'] }));
    fixture.detectChanges();
    expect(await piquetaSelect.isDisabled()).toBe(false);
  });

  it('keeps OLT unit selector enabled while planned numeric value is disabled', async () => {
    const { fixture } = await renderDialog();
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    fixture.detectChanges();
    await fixture.whenStable();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const oltUnitSelect = selects[1];
    if (!oltUnitSelect) throw new Error('OLT unit selector was not rendered');

    const numericInput = fixture.nativeElement.querySelector('input[inputSelectInput]') as HTMLInputElement | null;
    expect(await oltUnitSelect.isDisabled()).toBe(false);
    expect(dialog['angleOptions']).toHaveLength(3);
    expect(numericInput?.disabled).toBe(true);

    dialog.onOltChanged({ value: '100', unit: 'DEGREES' });
    expect(dialog['oltDisplayField']()).toEqual({ value: String(100 * (360 / 6400)), unit: 'DEGREES' });
  });

  it('displays the exact planned degree value after switching from mils', async () => {
    const { fixture } = await renderDialog({
      ...mockDialogData,
      seriesOrientations: [
        {
          seriesId: 'S2',
          orientations: [15 * (6400 / 360)],
          sourceOrientations: [{ value: 15, unit: AngleUnitEnum.DEGREES }],
        },
      ],
    });
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));

    expect(dialog['oltDisplayField']()).toEqual({ value: String(15 * (6400 / 360)), unit: AngleUnitEnum.MILS });
    dialog.onOltChanged({ value: String(15), unit: AngleUnitEnum.DEGREES });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialog['oltDisplayField']()).toEqual({ value: '15', unit: AngleUnitEnum.DEGREES });
    const numericInput = fixture.nativeElement.querySelector('input[inputSelectInput]') as HTMLInputElement | null;
    expect(numericInput?.value).toBe('15');
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

  it('blocks applying until planning data is available', async () => {
    const { fixture } = await renderDialog({
      ...mockDialogData,
      planningConditionsReady: false,
      planningConfigurationsReady: false,
    });
    const dialog = fixture.componentInstance;
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    dialog['velocidadInicialField'].set({ value: '800', unit: 'm/s' });

    expect(dialog['hasUnavailableOrientationData']()).toBe(true);
    expect(dialog['hasIncompatibleSeriesConfigurations']()).toBe(true);
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

  it('pre-fills and locks fields with planning information when a planned series is selected', async () => {
    const data: JltMaoMassConfigDialogData = {
      ...mockDialogData,
      seriesPlannedValues: [
        {
          seriesId: 'S1',
          ranges: [null],
          shootingAngles: [null],
          fuseGraduations: [null],
          functioningHeights: [null],
        },
        {
          seriesId: 'S2',
          ranges: [1500, 1500],
          shootingAngles: [350, 350],
          fuseGraduations: [45, 45],
          functioningHeights: [250, 250],
        },
      ],
    };
    const { fixture } = await renderDialog(data);
    const dialog = fixture.componentInstance;

    // Initially no series is selected, fields are editable and null
    expect(dialog['distanciaPiqueReadOnly']()).toBe(false);
    expect(dialog['distanciaPiqueDisplayField']()).toBeNull();
    expect(dialog['anguloTiroReadOnly']()).toBe(false);
    expect(dialog['anguloTiroDisplayField']()).toBeNull();
    expect(dialog['graduacionEspoletaReadOnly']()).toBe(false);
    expect(dialog['graduacionEspoletaDisplayField']()).toBeNull();
    expect(dialog['alturaFuncionamientoReadOnly']()).toBe(false);
    expect(dialog['alturaFuncionamientoDisplayField']()).toBeNull();

    // Select planned series S2
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));

    expect(dialog['distanciaPiqueReadOnly']()).toBe(true);
    expect(dialog['distanciaPiqueDisplayField']()).toEqual({ value: '1500', unit: 'm' });
    expect(dialog['anguloTiroReadOnly']()).toBe(true);
    expect(dialog['anguloTiroDisplayField']()).toEqual({ value: '350', unit: 'oo' });
    expect(dialog['graduacionEspoletaReadOnly']()).toBe(true);
    expect(dialog['graduacionEspoletaDisplayField']()).toEqual({ value: '45', unit: 's' });
    expect(dialog['alturaFuncionamientoReadOnly']()).toBe(true);
    expect(dialog['alturaFuncionamientoDisplayField']()).toEqual({ value: '250', unit: 'm' });

    // Modifying read-only planned fields does not change their values
    dialog.onDistanciaPiqueChanged({ value: '9999', unit: 'm' });
    dialog.onAnguloTiroChanged({ value: '999', unit: 'oo' });
    dialog.onGraduacionEspoletaChanged({ value: '99', unit: 's' });
    dialog.onAlturaFuncionamientoChanged({ value: '999', unit: 'm' });

    expect(dialog['distanciaPiqueDisplayField']()).toEqual({ value: '1500', unit: 'm' });
    expect(dialog['anguloTiroDisplayField']()).toEqual({ value: '350', unit: 'oo' });
    expect(dialog['graduacionEspoletaDisplayField']()).toEqual({ value: '45', unit: 's' });
    expect(dialog['alturaFuncionamientoDisplayField']()).toEqual({ value: '250', unit: 'm' });

    // Fill an applicable manual field and apply
    dialog['velocidadInicialField'].set({ value: '820', unit: 'm/s' });
    expect(dialog['canApply']()).toBe(true);
    dialog.apply();

    const result = closeSpy.mock.calls[closeSpy.mock.calls.length - 1][0];
    expect(result.distanciaPique).toEqual({ value: '1500', unit: 'm' });
    expect(result.anguloTiro).toEqual({ value: '350', unit: 'oo' });
    expect(result.graduacionEspoleta).toEqual({ value: '45', unit: 's' });
    expect(result.alturaFuncionamiento).toEqual({ value: '250', unit: 'm' });
    expect(result.velocidadInicial).toEqual({ value: '820', unit: 'm/s' });
  });

  it('leaves fields editable when a series without planned values is selected', async () => {
    const data: JltMaoMassConfigDialogData = {
      ...mockDialogData,
      seriesPlannedValues: [
        {
          seriesId: 'S1',
          ranges: [null],
          shootingAngles: [null],
          fuseGraduations: [null],
          functioningHeights: [null],
        },
      ],
    };
    const { fixture } = await renderDialog(data);
    const dialog = fixture.componentInstance;

    dialog['formModel'].update((model) => ({ ...model, series: ['S1'] }));

    expect(dialog['distanciaPiqueReadOnly']()).toBe(false);
    expect(dialog['anguloTiroReadOnly']()).toBe(false);
    expect(dialog['graduacionEspoletaReadOnly']()).toBe(false);
    expect(dialog['alturaFuncionamientoReadOnly']()).toBe(false);

    dialog.onDistanciaPiqueChanged({ value: '2000', unit: 'm' });
    dialog.onAnguloTiroChanged({ value: '400', unit: 'oo' });
    dialog.onGraduacionEspoletaChanged({ value: '30', unit: 's' });
    dialog.onAlturaFuncionamientoChanged({ value: '150', unit: 'm' });

    expect(dialog['distanciaPiqueDisplayField']()).toEqual({ value: '2000', unit: 'm' });
    expect(dialog['anguloTiroDisplayField']()).toEqual({ value: '400', unit: 'oo' });
    expect(dialog['graduacionEspoletaDisplayField']()).toEqual({ value: '30', unit: 's' });
    expect(dialog['alturaFuncionamientoDisplayField']()).toEqual({ value: '150', unit: 'm' });
  });

  it('patches execution data when a series with execution data is selected and allows editing non-planned fields', async () => {
    const data: JltMaoMassConfigDialogData = {
      ...mockDialogData,
      seriesExecutionValues: [
        {
          seriesId: 'S2',
          data: {
            theoreticalInitialVelocity: 780.5,
            plannedImpactDistance: 1200,
            tabularDrift: 2.5,
            theoreticalFlightTime: 3.2,
            angularDifference: 1.2,
            shootingAngle: 15,
            fuseGraduation: 8,
            functioningHeight: 20,
            functioningDistance: 1150,
          },
        },
      ],
    };
    const { fixture } = await renderDialog(data);
    const dialog = fixture.componentInstance;

    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    fixture.detectChanges();

    // Fields without planning values are patched from execution and remain editable
    expect(dialog['velocidadInicialField']()).toEqual({ value: '780.5', unit: 'm/s' });
    expect(dialog['distanciaPiqueDisplayField']()).toEqual({ value: '1200', unit: 'm' });
    expect(dialog['distanciaPiqueReadOnly']()).toBe(false);
    expect(dialog['derivaTabularField']()).toEqual({ value: '2.5', unit: 'oo' });
    expect(dialog['tiempoVueloField']()).toEqual({ value: '3.2', unit: 's' });
    expect(dialog['diferenciaAngularField']()).toEqual({ value: '1.2', unit: 'oo' });
    expect(dialog['anguloTiroDisplayField']()).toEqual({ value: '15', unit: 'oo' });
    expect(dialog['anguloTiroReadOnly']()).toBe(false);
    expect(dialog['graduacionEspoletaDisplayField']()).toEqual({ value: '8', unit: 's' });
    expect(dialog['graduacionEspoletaReadOnly']()).toBe(false);
    expect(dialog['alturaFuncionamientoDisplayField']()).toEqual({ value: '20', unit: 'm' });
    expect(dialog['alturaFuncionamientoReadOnly']()).toBe(false);
    expect(dialog['distanciaFuncionamientoField']()).toEqual({ value: '1150', unit: 'm' });

    // User can edit fields that came from execution and not from planning
    dialog.onDistanciaPiqueChanged({ value: '1300', unit: 'm' });
    dialog['velocidadInicialField'].set({ value: '790', unit: 'm/s' });
    dialog.onAnguloTiroChanged({ value: '18', unit: 'oo' });

    expect(dialog['distanciaPiqueDisplayField']()).toEqual({ value: '1300', unit: 'm' });
    expect(dialog['velocidadInicialField']()).toEqual({ value: '790', unit: 'm/s' });
    expect(dialog['anguloTiroDisplayField']()).toEqual({ value: '18', unit: 'oo' });
  });

  it('keeps planning values read-only while execution values not in planning remain editable', async () => {
    const data: JltMaoMassConfigDialogData = {
      ...mockDialogData,
      seriesPlannedValues: [
        {
          seriesId: 'S2',
          ranges: [1500],
          shootingAngles: [350],
          fuseGraduations: [null],
          functioningHeights: [null],
        },
      ],
      seriesExecutionValues: [
        {
          seriesId: 'S2',
          data: {
            theoreticalInitialVelocity: 750,
            plannedImpactDistance: 9999, // Should be ignored in favor of planning 1500
            shootingAngle: 8888, // Should be ignored in favor of planning 350
            fuseGraduation: 12, // Planning has null -> patched from execution
            functioningHeight: 25, // Planning has null -> patched from execution
            tabularDrift: 4,
          },
        },
      ],
    };
    const { fixture } = await renderDialog(data);
    const dialog = fixture.componentInstance;

    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    fixture.detectChanges();

    // Planning values win and are read-only
    expect(dialog['distanciaPiqueReadOnly']()).toBe(true);
    expect(dialog['distanciaPiqueDisplayField']()).toEqual({ value: '1500', unit: 'm' });
    expect(dialog['anguloTiroReadOnly']()).toBe(true);
    expect(dialog['anguloTiroDisplayField']()).toEqual({ value: '350', unit: 'oo' });

    // Modifying read-only planning fields does not change them
    dialog.onDistanciaPiqueChanged({ value: '2000', unit: 'm' });
    expect(dialog['distanciaPiqueDisplayField']()).toEqual({ value: '1500', unit: 'm' });

    // Execution values not in planning are patched and can be edited
    expect(dialog['velocidadInicialField']()).toEqual({ value: '750', unit: 'm/s' });
    expect(dialog['graduacionEspoletaReadOnly']()).toBe(false);
    expect(dialog['graduacionEspoletaDisplayField']()).toEqual({ value: '12', unit: 's' });
    expect(dialog['alturaFuncionamientoReadOnly']()).toBe(false);
    expect(dialog['alturaFuncionamientoDisplayField']()).toEqual({ value: '25', unit: 'm' });
    expect(dialog['derivaTabularField']()).toEqual({ value: '4', unit: 'oo' });

    dialog.onGraduacionEspoletaChanged({ value: '14', unit: 's' });
    expect(dialog['graduacionEspoletaDisplayField']()).toEqual({ value: '14', unit: 's' });
  });

  it('displays TTN field with execution data depending on selected series and allows editing', async () => {
    const data: JltMaoMassConfigDialogData = {
      ...mockDialogData,
      currentTtn: 'TTN-DEFAULT',
      seriesExecutionValues: [
        {
          seriesId: 'S1',
          data: {
            numericFiringTable: 'TTN-SERIES-1',
            theoreticalInitialVelocity: 800,
          },
        },
        {
          seriesId: 'S2',
          data: {
            numericFiringTable: 'TTN-SERIES-2',
            theoreticalInitialVelocity: 820,
          },
        },
      ],
    };
    const { fixture } = await renderDialog(data);
    const dialog = fixture.componentInstance;

    // Initially starts with current TTN
    expect(dialog['ttnField']()).toBe('TTN-DEFAULT');

    // Selecting S1 loads S1's TTN
    dialog['formModel'].update((model) => ({ ...model, series: ['S1'] }));
    fixture.detectChanges();
    expect(dialog['ttnField']()).toBe('TTN-SERIES-1');

    // Selecting S2 loads S2's TTN
    dialog['formModel'].update((model) => ({ ...model, series: ['S2'] }));
    fixture.detectChanges();
    expect(dialog['ttnField']()).toBe('TTN-SERIES-2');

    // User can edit TTN
    dialog.onTtnInput({ target: { value: 'TTN-CUSTOM' } } as unknown as Event);
    expect(dialog['ttnField']()).toBe('TTN-CUSTOM');

    // Apply includes TTN in result
    dialog.apply();
    const result = closeSpy.mock.calls[closeSpy.mock.calls.length - 1][0];
    expect(result.action).toBe('apply');
    expect(result.ttn).toBe('TTN-CUSTOM');
  });
});
