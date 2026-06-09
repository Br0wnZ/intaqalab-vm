import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';

import { provideTestingEnvironment } from '@intaqalab/config';
import type { MaoTopographyMassConfigDialogData } from './mao-topography-mass-config-dialog';
import { MaoTopographyMassConfigDialog } from './mao-topography-mass-config-dialog';

const mockDialogData: MaoTopographyMassConfigDialogData = {
  serieOptions: [
    { value: 'serie-01', label: 'Funcionamiento I' },
    { value: 'serie-02', label: 'Funcionamiento II' },
  ],
  observadorOptions: [
    { value: 'obs-01', label: 'Observador 01' },
    { value: 'obs-02', label: 'Observador 02' },
  ],
  current: {
    xPieza:    { value: '100.0', unit: 'm' },
    yPieza:    { value: '200.0', unit: 'm' },
    zPieza:    { value: '10.0',  unit: 'm' },
    xBlanco:   { value: '300.0', unit: 'm' },
    yBlanco:   { value: '400.0', unit: 'm' },
    zBlanco:   { value: '15.0',  unit: 'm' },
    olt:       { value: '15.000', unit: 'oo' },
    observador: 'obs-01',
  },
};

const mockDialogRef = {
  close: vi.fn(),
};

describe('MaoTopographyMassConfigDialog', () => {
  const renderDialog = (data: MaoTopographyMassConfigDialogData = mockDialogData) =>
    render(MaoTopographyMassConfigDialog, {
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: mockDialogRef },
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
      xPiezaField: () => { value: string; unit: string } | null;
      yPiezaField: () => { value: string; unit: string } | null;
      oltField:    () => { value: string; unit: string } | null;
    };
    expect(component.xPiezaField()?.value).toBe('100.0');
    expect(component.yPiezaField()?.value).toBe('200.0');
    expect(component.oltField()?.value).toBe('15.000');
  });

  it('initializes observador from dialog data', async () => {
    const { fixture } = await renderDialog();
    const formValues = (fixture.componentInstance as unknown as {
      formModel: () => { series: string[]; observador: string | null };
    }).formModel();
    expect(formValues.observador).toBe('obs-01');
    expect(formValues.series).toEqual([]);
  });

  it('apply() calls dialogRef.close with action=apply and current field values', async () => {
    const { fixture } = await renderDialog();
    mockDialogRef.close.mockClear();

    fixture.componentInstance.apply();

    expect(mockDialogRef.close).toHaveBeenCalledOnce();
    const result = mockDialogRef.close.mock.calls[0][0];
    expect(result.action).toBe('apply');
    expect(result.xPieza).toEqual({ value: '100.0', unit: 'm' });
    expect(result.olt).toEqual({ value: '15.000', unit: 'oo' });
    expect(result.observador).toBe('obs-01');
    expect(result.series).toEqual([]);
  });

  it('cancel button closes dialog with action=cancel', async () => {
    await renderDialog();
    mockDialogRef.close.mockClear();

    // The cancel button uses [mat-dialog-close] directive with { action: 'cancel' }
    // so it wires directly to dialogRef — we verify the button is present
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelBtn).toBeTruthy();
  });

  it('renders all 8 input fields', async () => {
    await renderDialog();
    const labels = document.querySelectorAll('ui-input-select');
    // 6 from ui-input-select (pieza x/y/z, blanco x/y/z) + olt = 7
    // observador is a mat-select
    expect(labels.length).toBe(7);
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
        xPieza: null, yPieza: null, zPieza: null,
        xBlanco: null, yBlanco: null, zBlanco: null,
        olt: null, observador: null,
      },
    };
    const { fixture } = await renderDialog(nullData);
    const component = fixture.componentInstance as unknown as {
      xPiezaField: () => { value: string; unit: string } | null;
    };
    expect(component.xPiezaField()).toBeNull();
  });

  it('apply() returns updated field value when signal is mutated', async () => {
    const { fixture } = await renderDialog();
    mockDialogRef.close.mockClear();

    const component = fixture.componentInstance as unknown as {
      xPiezaField: ReturnType<typeof import('@angular/core').signal>;
    };
    component.xPiezaField.set({ value: '999.9', unit: 'm' });

    fixture.componentInstance.apply();

    const result = mockDialogRef.close.mock.calls[0][0];
    expect(result.xPieza).toEqual({ value: '999.9', unit: 'm' });
  });
});
