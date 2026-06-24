/* eslint-disable @typescript-eslint/no-explicit-any */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  EquipmentSelectorDialog,
  type EquipmentSelectorDialogData,
  type EquipmentTagMapping,
} from './equipment-selector-dialog';

const mockTagMappings: EquipmentTagMapping[] = [
  {
    tag: 'velocidad_inicial',
    label: 'Velocidad Inicial',
    fields: [
      { key: 'radar_doppler', label: 'Radar Doppler', type: 'select', options: [{ value: 'rd1', label: 'RD-001' }] },
      { key: 'antena', label: 'Antena', type: 'select', options: [{ value: 'a1', label: 'Antena 1' }] },
    ],
  },
  {
    tag: 'tiempo',
    label: 'Tiempo',
    fields: [
      { key: 'cronometro', label: 'Cronómetro', type: 'select', options: [{ value: 'c1', label: 'Cronómetro 1' }] },
    ],
  },
];

const mockData: EquipmentSelectorDialogData = {
  tags: ['velocidad_inicial', 'tiempo'],
  tagMappings: mockTagMappings,
  items: [
    { id: 'rd-001', label: 'RD-001', tag: 'velocidad_inicial' },
    { id: 'rd-002', label: 'RD-002', tag: 'velocidad_inicial' },
    { id: 'timer-001', label: 'TIMER-001', tag: 'tiempo' },
  ],
  serieOptions: [
    { value: 's1', label: 'Serie 1' },
    { value: 's2', label: 'Serie 2' },
  ],
  disparoOptions: [
    { value: 'd1', label: 'Disparo 1' },
    { value: 'd2', label: 'Disparo 2' },
  ],
  dynamicFieldOptions: {
    radar_doppler: [{ value: 'rd1', label: 'RD-001' }],
    antena: [{ value: 'a1', label: 'Antena 1' }],
    cronometro: [{ value: 'c1', label: 'Cronómetro 1' }],
  } as any,
  initialSelections: [],
};

describe('EquipmentSelectorDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;

  const setup = async (data: EquipmentSelectorDialogData = mockData) => {
    closeMock = vi.fn();
    return render(EquipmentSelectorDialog, {
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      imports: [TranslateModule.forRoot()],
    });
  };

  it('renders dialog without errors', async () => {
    await setup();
    expect(document.querySelector('[mat-dialog-title]')).toBeTruthy();
  });

  it('shows tag select field', async () => {
    await setup();
    const selectField = screen.getByRole('combobox');
    expect(selectField).toBeInTheDocument();
  });

  it('renders back and save action buttons', async () => {
    await setup();
    expect(screen.getByText(/guardar|Save/i)).toBeInTheDocument();
    expect(screen.getByText(/volver|Back|Return/i)).toBeInTheDocument();
  });

  it('displays equipment table when tag is selected', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();

    // Select a tag
    const select = screen.getByRole('combobox');
    await user.click(select);
    fixture.detectChanges();

    const option = screen.getAllByRole('option')[0];
    await user.click(option);
    fixture.detectChanges();

    // Table should be visible
    expect(screen.getByText(/Equipo|Equipment/i)).toBeInTheDocument();
  });

  it('allows adding equipment rows', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();

    // Select a tag first
    const select = screen.getByRole('combobox');
    await user.click(select);
    fixture.detectChanges();

    const option = screen.getAllByRole('option')[0];
    await user.click(option);
    fixture.detectChanges();

    // Click add equipment button
    const addBtn = screen.getByRole('button', { name: /añadir|add/i });
    await user.click(addBtn);
    fixture.detectChanges();

    // Check that we have more rows
    expect(screen.getAllByRole('option', { name: /Disparo|Disparo/i }).length).toBeGreaterThan(0);
  });

  it('closes dialog on back button click', async () => {
    const user = userEvent.setup();
    await setup();

    const backBtn = screen.getByText(/volver|Back|Return/i);
    await user.click(backBtn);

    expect(closeMock).toHaveBeenCalledWith({ action: 'back' });
  });

  it('closes with { action: "save", selections: [] } on save with no selections', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();
    const saveBtn = document.querySelector('button[mat-flat-button]') as HTMLElement;
    await user.click(saveBtn);
    fixture.detectChanges();
    expect(closeMock).toHaveBeenCalledWith({ action: 'save', selections: [] });
  });

  it('initialSelections pre-check items', async () => {
    const { fixture } = await setup(mockDataWithSelections);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    expect(instance.isChecked('rd-001')).toBe(true);
    expect(instance.isChecked('rd-002')).toBe(false);
  });

  it('initialSelections restore series and disparos', async () => {
    const { fixture } = await setup(mockDataWithSelections);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    expect(instance.getRowSeries('rd-001')).toEqual(['s1']);
    expect(instance.getRowDisparos('rd-001')).toEqual(['d1', 'd2']);
  });

  it('toggleItem checks an item', async () => {
    const { fixture } = await setup();
    const instance = fixture.componentInstance;
    const item = mockData.items[0];
    instance.toggleItem(item, true);
    fixture.detectChanges();
    expect(instance.isChecked(item.id)).toBe(true);
  });

  it('toggleItem unchecks an item', async () => {
    const { fixture } = await setup(mockDataWithSelections);
    const instance = fixture.componentInstance;
    const item = mockData.items[0]; // rd-001 is pre-checked
    instance.toggleItem(item, false);
    fixture.detectChanges();
    expect(instance.isChecked(item.id)).toBe(false);
  });

  it('uncheckItem removes item from selection', async () => {
    const { fixture } = await setup(mockDataWithSelections);
    const instance = fixture.componentInstance;
    instance.uncheckItem('rd-001');
    fixture.detectChanges();
    expect(instance.isChecked('rd-001')).toBe(false);
  });

  it('isAtMax returns true when category reaches maxSelection', async () => {
    const { fixture } = await setup();
    const instance = fixture.componentInstance;
    // max is 2 for radar; check 2 items
    instance.toggleItem(mockData.items[0], true);
    instance.toggleItem(mockData.items[1], true);
    fixture.detectChanges();
    expect(instance.isAtMax()).toBe(true);
  });

  it('cannot select more items than maxSelection', async () => {
    const { fixture } = await setup();
    const instance = fixture.componentInstance;
    instance.toggleItem(mockData.items[0], true);
    instance.toggleItem(mockData.items[1], true);
    // Try to add third item — should be blocked
    instance.toggleItem(mockData.items[2], true);
    fixture.detectChanges();
    expect(instance.isChecked(mockData.items[2].id)).toBe(false);
  });

  it('updateRowSeries stores multiple series for an item', async () => {
    const { fixture } = await setup();
    const instance = fixture.componentInstance;
    instance.updateRowSeries('rd-001', ['s1', 's2']);
    fixture.detectChanges();
    expect(instance.getRowSeries('rd-001')).toEqual(['s1', 's2']);
  });

  it('updateRowDisparos stores multiple disparos for an item', async () => {
    const { fixture } = await setup();
    const instance = fixture.componentInstance;
    instance.updateRowDisparos('rd-001', ['d1', 'd2']);
    fixture.detectChanges();
    expect(instance.getRowDisparos('rd-001')).toEqual(['d1', 'd2']);
  });

  it('save() emits selections with series and disparos arrays', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();
    const instance = fixture.componentInstance;
    instance.toggleItem(mockData.items[0], true);
    instance.updateRowSeries('rd-001', ['s1']);
    instance.updateRowDisparos('rd-001', ['d1', 'd2']);
    fixture.detectChanges();

    const saveBtn = document.querySelector('button[mat-flat-button]') as HTMLElement;
    await user.click(saveBtn);

    const expected: EquipmentItemSelectionEntry = {
      itemId: 'rd-001',
      categoryId: 'radar',
      series: ['s1'],
      disparos: ['d1', 'd2'],
    };
    expect(closeMock).toHaveBeenCalledWith({ action: 'save', selections: [expected] });
  });

  it('getCategoryTotalCount returns correct count', async () => {
    const { fixture } = await setup();
    const instance = fixture.componentInstance;
    expect(instance.getCategoryTotalCount('radar')).toBe(3);
    expect(instance.getCategoryTotalCount('camera')).toBe(1);
  });
});
