import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthService, Role } from '@intaqalab/core';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { EquipmentMagnitudeTagEnum, EquipmentTypeEnum } from '../models';
import { EquipmentSelectorDialog, type EquipmentSelectorDialogData } from './equipment-selector-dialog';

const mockData: EquipmentSelectorDialogData = {
  categories: [],
  items: [
    { id: 'rd-001', label: 'RD-001', equipmentType: EquipmentTypeEnum.DOPPLER_RADAR },
    { id: 'rd-002', label: 'RD-002', equipmentType: EquipmentTypeEnum.DOPPLER_RADAR },
    { id: 'ant-001', label: 'ANT-001', equipmentType: EquipmentTypeEnum.ANTENNA },
  ],
  serieOptions: [
    { value: 's1', label: 'Serie 1' },
    { value: 's2', label: 'Serie 2' },
  ],
  disparoOptions: [
    { value: 'd1', label: 'Disparo 1' },
    { value: 'd2', label: 'Disparo 2' },
  ],
  serieDisparoMap: { s1: ['d1'], s2: ['d2'] },
  initialEquipments: [],
};

describe('EquipmentSelectorDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;

  const setup = async (data: EquipmentSelectorDialogData = mockData, roles: Role[] = [Role.INTAQALAB_ADMIN]) => {
    closeMock = vi.fn();
    const view = await render(EquipmentSelectorDialog, {
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthService,
          useFactory: () => {
            const auth = new AuthService();
            auth.setRoles(roles);
            return auth;
          },
        },
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      imports: [TranslateModule.forRoot()],
    });
    return { ...view, component: view.fixture.componentInstance };
  };

  it('renders dialog without errors', async () => {
    await setup();
    expect(document.querySelector('[mat-dialog-title]')).toBeTruthy();
  });

  it('shows one chip per visible tag for an admin role', async () => {
    const { component } = await setup();
    const chips = document.querySelectorAll('mat-chip-option');
    expect(component.visibleTags().length).toBeGreaterThan(0);
    expect(chips.length).toBe(component.visibleTags().length);
  });

  it('hides all tags when the user has no matching role', async () => {
    const { component } = await setup(mockData, []);
    expect(component.visibleTags()).toEqual([]);
    expect(document.querySelectorAll('mat-chip-option').length).toBe(0);
  });

  it('auto-selects the first visible tag with one empty row', async () => {
    const { component } = await setup();
    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    expect(component.activeTagRows()).toHaveLength(1);
  });

  it('selectTag switches tag and initializes its state', async () => {
    const { component } = await setup();
    component.selectTag(EquipmentMagnitudeTagEnum.TIEMPO);
    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.TIEMPO);
    expect(component.activeTagRows()).toHaveLength(1);
  });

  it('selectTag preserves existing state when returning to a tag', async () => {
    const { component } = await setup();
    component.addRow();
    expect(component.activeTagRows()).toHaveLength(2);

    component.selectTag(EquipmentMagnitudeTagEnum.TIEMPO);
    component.selectTag(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    expect(component.activeTagRows()).toHaveLength(2);
  });

  it('addRow appends a new empty row', async () => {
    const { component } = await setup();
    component.addRow();
    expect(component.activeTagRows()).toHaveLength(2);
  });

  it('removeRow deletes the given row', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.removeRow(rowId);
    expect(component.activeTagRows()).toHaveLength(0);
  });

  it('setFieldValue / getFieldValue round-trip', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.setFieldValue(rowId, 'radar_doppler', 'rd-001');
    expect(component.getFieldValue(rowId, 'radar_doppler')).toBe('rd-001');
  });

  it('setRowSeries and setRowDisparos store the given arrays', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.setRowSeries(rowId, ['s1', 's2']);
    component.setRowDisparos(rowId, ['d1']);
    const row = component.activeTagRows()[0];
    expect(row.series).toEqual(['s1', 's2']);
    expect(row.disparos).toEqual(['d1']);
  });

  it('handleSeriesSelection expands the select-all value to every serie and derives disparos', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.handleSeriesSelection(rowId, [component.selectAllSeriesValue]);
    const row = component.activeTagRows()[0];
    expect(row.series).toEqual(['s1', 's2']);
    expect(row.disparos).toEqual(['d1', 'd2']);
  });

  it('handleSeriesSelection derives disparos from serieDisparoMap for concrete series', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.handleSeriesSelection(rowId, ['s2']);
    const row = component.activeTagRows()[0];
    expect(row.series).toEqual(['s2']);
    expect(row.disparos).toEqual(['d2']);
  });

  it('getItemsByCategory filters items by equipment type', async () => {
    const { component } = await setup();
    const items = component.getItemsByCategory(EquipmentTypeEnum.DOPPLER_RADAR);
    expect(items.map((i) => i.id)).toEqual(['rd-001', 'rd-002']);
  });

  it('save() closes with empty equipments when no field is filled', async () => {
    const { component } = await setup();
    component.save();
    expect(closeMock).toHaveBeenCalledWith({ action: 'save', equipments: [] });
  });

  it('save() collects filled rows into equipment groups', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.setFieldValue(rowId, 'radar_doppler', 'rd-001');
    component.setRowSeries(rowId, ['s1']);
    component.setRowDisparos(rowId, ['d1']);

    component.save();

    expect(closeMock).toHaveBeenCalledWith({
      action: 'save',
      equipments: [
        {
          id: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
          selections: [
            {
              itemId: 'rd-001',
              categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
              series: ['s1'],
              disparos: ['d1'],
            },
          ],
        },
      ],
    });
  });

  it('hydrates rows and selected tag from initialEquipments', async () => {
    const { component } = await setup({
      ...mockData,
      initialEquipments: [
        {
          id: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
          selections: [
            {
              itemId: 'rd-002',
              categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
              series: ['s2'],
              disparos: ['d2'],
            },
          ],
        },
      ],
    });

    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    const row = component.activeTagRows()[0];
    expect(row.fieldValues['radar_doppler']).toBe('rd-002');
    expect(row.series).toEqual(['s2']);
    expect(row.disparos).toEqual(['d2']);
  });
});
