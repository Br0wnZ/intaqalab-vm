import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  EquipmentSelectorDialog,
  type EquipmentSelectorDialogData,
  type EquipmentItemSelectionEntry,
} from './equipment-selector-dialog';

const mockData: EquipmentSelectorDialogData = {
  categories: [
    { id: 'radar', label: 'Radar Doppler', maxSelection: 2 },
    { id: 'camera', label: 'Cámara', maxSelection: 1 },
  ],
  items: [
    { id: 'rd-001', label: 'RD-001', categoryId: 'radar' },
    { id: 'rd-002', label: 'RD-002', categoryId: 'radar' },
    { id: 'rd-003', label: 'RD-003', categoryId: 'radar' },
    { id: 'cam-001', label: 'CAM-001', categoryId: 'camera' },
  ],
  serieOptions: [
    { value: 's1', label: 'Serie 1' },
    { value: 's2', label: 'Serie 2' },
  ],
  disparoOptions: [
    { value: 'd1', label: 'Disparo 1' },
    { value: 'd2', label: 'Disparo 2' },
  ],
  initialSelections: [],
};

const mockDataWithSelections: EquipmentSelectorDialogData = {
  ...mockData,
  initialSelections: [
    { itemId: 'rd-001', categoryId: 'radar', series: ['s1'], disparos: ['d1', 'd2'] },
  ],
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

  it('renders without errors', async () => {
    await setup();
    expect(document.querySelector('[mat-dialog-title]')).toBeTruthy();
  });

  it('shows category tab buttons', async () => {
    await setup();
    // Buttons show "label maxSel/total" format — use exact chip text to avoid h3 ambiguity
    expect(screen.getByText(/Radar Doppler 2\/3/)).toBeInTheDocument();
    expect(screen.getByText(/Cámara 1\/1/)).toBeInTheDocument();
  });

  it('tab chip shows maxSelection/totalAvailable', async () => {
    await setup();
    // Radar Doppler has maxSelection=2 and 3 items → "Radar Doppler 2/3"
    expect(screen.getByText(/Radar Doppler 2\/3/)).toBeInTheDocument();
    // Cámara has maxSelection=1 and 1 item → "Cámara 1/1"
    expect(screen.getByText(/Cámara 1\/1/)).toBeInTheDocument();
  });

  it('renders items of active category (radar by default)', async () => {
    await setup();
    expect(screen.getByText('RD-001')).toBeInTheDocument();
    expect(screen.getByText('RD-002')).toBeInTheDocument();
    expect(screen.getByText('RD-003')).toBeInTheDocument();
  });

  it('switches to camera category when tab clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();
    const cameraTab = screen.getByText(/Cámara/);
    await user.click(cameraTab);
    fixture.detectChanges();
    expect(screen.getByText('CAM-001')).toBeInTheDocument();
  });

  it('renders back and save action buttons', async () => {
    await setup();
    const buttons = screen.getAllByRole('button');
    // At least 2 action buttons (back + save) plus category tabs + potential checkboxes
    expect(buttons.length).toBeGreaterThanOrEqual(2);
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
