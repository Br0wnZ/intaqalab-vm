import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService, Role } from '@intaqalab/core';
import { QualificationTypeEnum } from '@intaqalab/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EquipmentPlanningService } from '../../services/equipment-planning.service';
import { ExecutionService } from '../../services/execution.service';
import { EquipmentMagnitudeTagEnum, type EquipmentSelectorDialogData, EquipmentTypeEnum } from '../models';
import { EquipmentSelectorStore } from './equipment-selector.store';

describe('EquipmentSelectorStore', () => {
  let store: InstanceType<typeof EquipmentSelectorStore>;

  const mockPlanningService = {
    load: vi.fn(),
    trialMeasuresResource: {
      status: signal<'resolved'>('resolved').asReadonly(),
      value: () => ({
        series: [
          {
            seriesId: 's1',
            measures: { ballisticsMeasures: [{ id: 'velocity-measure' }] },
          },
        ],
      }),
      isLoading: () => false,
      error: () => null,
    },
    catalogResource: {
      status: signal<'resolved'>('resolved').asReadonly(),
      value: () => ({ items: [] }),
      isLoading: () => false,
      error: () => null,
    },
    catalog: () => [
      {
        id: 'velocity-measure',
        magnitudeCode: 'BAL_INITIAL_VELOCITY',
        magnitudeLabel: 'Velocidad inicial',
        qualificationType: QualificationTypeEnum.QUANTITATIVE,
        measurements: [EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL],
      },
    ],
    isLoading: () => false,
    error: () => null,
  };

  const mockExecutionService = {
    getEquipmentSelector: vi.fn(),
    loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
      [EquipmentTypeEnum.DOPPLER_RADAR]: [{ id: 'rd-1', label: 'Radar 1' }],
      [EquipmentTypeEnum.ANTENNA]: [{ id: 'ant-1', label: 'Antenna 1' }],
    }),
    equipmentSelectorResource: {
      status: signal<'resolved'>('resolved').asReadonly(),
      value: () => [],
      hasValue: () => true,
      isLoading: () => false,
      error: () => null,
    },
    updateEquipmentSelectorResource: {
      isLoading: () => false,
    },
  };

  const sampleData: EquipmentSelectorDialogData = {
    fireTrialId: 'trial-123',
    serieOptions: [
      { value: 's1', label: 'Serie 1' },
      { value: 's2', label: 'Serie 2' },
    ],
    disparoOptions: [
      { value: 'd1', label: 'Disparo 1' },
      { value: 'd2', label: 'Disparo 2' },
    ],
    serieDisparoMap: { s1: ['d1'], s2: ['d2'] },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            userRoles: signal([Role.INTAQALAB_ADMIN]),
          },
        },
        { provide: EquipmentPlanningService, useValue: mockPlanningService },
        { provide: ExecutionService, useValue: mockExecutionService },
        EquipmentSelectorStore,
      ],
    });

    store = TestBed.inject(EquipmentSelectorStore);
  });

  it('initializes with dialog data and triggers planning load', async () => {
    store.init(sampleData);
    TestBed.tick();

    expect(mockPlanningService.load).toHaveBeenCalledWith('trial-123');
    expect(mockExecutionService.getEquipmentSelector).toHaveBeenCalledWith('trial-123');
    expect(store.visibleTags().length).toBeGreaterThan(0);
    expect(store.enabledTagIds()).toEqual(new Set([EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL]));
    expect(store.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    expect(store.activeTagRows()).toHaveLength(1);
  });

  it('filters active series to only those with measures planned for the selected tag', () => {
    store.init(sampleData);
    TestBed.tick();

    expect(store.activeSeriesOptions().map((s) => s.value)).toEqual(['s1']);
  });

  it('manages rows addition, update and removal', () => {
    store.init(sampleData);
    TestBed.tick();

    expect(store.activeTagRows()).toHaveLength(1);
    store.addRow();
    expect(store.activeTagRows()).toHaveLength(2);

    const firstRowId = store.activeTagRows()[0]?.rowId;
    expect(firstRowId).toBeDefined();
    if (!firstRowId) throw new Error('First row ID undefined');

    store.setFieldValue(firstRowId, 'radar_doppler', 'rd-1');
    expect(store.activeTagRows()[0]?.fieldValues['radar_doppler']).toBe('rd-1');

    store.removeRow(firstRowId);
    expect(store.activeTagRows()).toHaveLength(1);
    expect(store.activeTagRows()[0]?.rowId).not.toBe(firstRowId);
  });

  it('handles series selection with select all option expanding to available planned series', () => {
    store.init(sampleData);
    TestBed.tick();

    const rowId = store.activeTagRows()[0]?.rowId;
    if (!rowId) throw new Error('Row ID undefined');

    store.handleSeriesSelection(rowId, ['__ALL_SERIES__']);
    const row = store.activeTagRows()[0];
    expect(row?.series).toEqual(['s1']);
    expect(row?.disparos).toEqual(['d1']);
  });

  it('computes isDirty and canSave based on completeness of row fields', async () => {
    store.init(sampleData);
    await vi.waitFor(() => {
      TestBed.tick();
      expect(store.isInitialized()).toBe(true);
    });

    expect(store.isDirty()).toBe(false);
    expect(store.canSave()).toBe(false);

    const rowId = store.activeTagRows()[0]?.rowId;
    if (!rowId) throw new Error('Row ID undefined');

    // Partially filled row (dirty but not saveable)
    store.setFieldValue(rowId, 'radar_doppler', 'rd-1');
    store.setRowSeries(rowId, ['s1']);
    expect(store.isDirty()).toBe(true);
    expect(store.canSave()).toBe(false);

    // Fully filled row (radar + antenna + series + shots)
    store.setFieldValue(rowId, 'antena', 'ant-1');
    store.setRowDisparos(rowId, ['d1']);
    expect(store.canSave()).toBe(true);
  });
});
