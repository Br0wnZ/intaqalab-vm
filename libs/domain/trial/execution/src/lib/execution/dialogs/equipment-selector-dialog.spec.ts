import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthService, Role } from '@intaqalab/core';
import { QualificationTypeEnum } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { EquipmentSelectorPlanningService } from '../../services/equipment-selector-planning.service';
import { type EquipmentSelectorResponse, ExecutionService } from '../../services/execution.service';
import { EquipmentMagnitudeTagEnum, type EquipmentSelectorDialogData, EquipmentTypeEnum } from '../models';
import { EquipmentSelectorDialog } from './equipment-selector-dialog';

// Items returned by the mocked loadEquipmentItemsByCategories
const mockItemsByCategory = {
  [EquipmentTypeEnum.DOPPLER_RADAR]: [
    { id: 'rd-001', label: 'RD-001 / DOP-001' },
    { id: 'rd-002', label: 'RD-002 / DOP-002' },
  ],
  [EquipmentTypeEnum.ANTENNA]: [{ id: 'ant-001', label: 'ANT-001 / ANT-001' }],
};

function createMockExecutionService(initialSelections: EquipmentSelectorResponse = []) {
  const statusSignal = signal<'idle' | 'loading' | 'resolved' | 'error'>('resolved');
  const errorSignal = signal<unknown>(null);
  return {
    getEquipmentSelector: vi.fn(),
    loadEquipmentItemsByCategories: vi.fn().mockResolvedValue(mockItemsByCategory),
    updateEquipmentSelector: vi.fn(),
    setEquipmentSelectorStatus: (status: 'idle' | 'loading' | 'resolved' | 'error') => statusSignal.set(status),
    setEquipmentSelectorError: (error: unknown) => errorSignal.set(error),
    equipmentSelectorResource: {
      status: statusSignal.asReadonly(),
      value: () => initialSelections,
      hasValue: () => statusSignal() === 'resolved',
      error: errorSignal.asReadonly(),
      isLoading: () => false,
    },
    updateEquipmentSelectorResource: {
      status: signal<'idle' | 'loading' | 'resolved' | 'error'>('idle').asReadonly(),
      isLoading: () => false,
    },
  };
}

const mockData: EquipmentSelectorDialogData = {
  fireTrialId: 'trial-001',
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

function createMockPlanningService(
  measureIds: string[] = ['velocity', 'time'],
  failure: Error | null = null,
  seriesIds: string[] = ['s1', 's2'],
) {
  return {
    load: vi.fn(),
    trialMeasuresResource: {
      status: signal<'resolved'>('resolved').asReadonly(),
      value: () => ({
        series: seriesIds.map((seriesId) => ({
          seriesId,
          measures: { ballisticsMeasures: measureIds.map((id) => ({ id })) },
        })),
      }),
    },
    catalogResource: {
      status: signal<'resolved'>('resolved').asReadonly(),
      value: () => ({ items: [] }),
      isLoading: () => false,
      error: () => null,
    },
    catalog: () => [
      {
        id: 'velocity',
        magnitudeCode: 'BAL_INITIAL_VELOCITY',
        magnitudeLabel: 'Velocidad inicial',
        qualificationType: QualificationTypeEnum.QUANTITATIVE,
        measurements: [EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL],
      },
      {
        id: 'time',
        magnitudeCode: 'TOP_FLIGHT_TIME',
        magnitudeLabel: 'Tiempo de vuelo',
        qualificationType: QualificationTypeEnum.QUANTITATIVE,
        measurements: [EquipmentMagnitudeTagEnum.TIEMPO],
      },
    ],
    isLoading: () => false,
    error: () => failure,
  };
}

describe('EquipmentSelectorDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;

  const setup = async (
    data: EquipmentSelectorDialogData = mockData,
    roles: Role[] = [Role.INTAQALAB_ADMIN],
    planningService = createMockPlanningService(),
    executionService = createMockExecutionService(),
  ) => {
    closeMock = vi.fn();
    const view = await render(EquipmentSelectorDialog, {
      componentProviders: [{ provide: EquipmentSelectorPlanningService, useValue: planningService }],
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
        { provide: ExecutionService, useValue: executionService },
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      imports: [TranslateModule.forRoot()],
    });
    return { ...view, component: view.fixture.componentInstance };
  };

  it('renders dialog without errors', async () => {
    await setup();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('shows the error view when planning data cannot be loaded', async () => {
    const { component } = await setup(
      mockData,
      [Role.INTAQALAB_ADMIN],
      createMockPlanningService(undefined, new Error('Planning unavailable')),
    );

    expect(component.isLoading()).toBe(false);
    expect(screen.getByText('TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.ERRORS.LOAD_FAILED_TITLE')).toBeInTheDocument();
  });

  it('treats a 404 equipment selection response as an empty selection', async () => {
    const executionService = createMockExecutionService();
    executionService.setEquipmentSelectorStatus('error');
    executionService.setEquipmentSelectorError(new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));

    const { component, fixture } = await setup(
      mockData,
      [Role.INTAQALAB_ADMIN],
      createMockPlanningService(),
      executionService,
    );

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(component.error()).toBe(false);
      expect(component.isLoading()).toBe(false);
      expect(
        screen.queryByText('TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.ERRORS.LOAD_FAILED_TITLE'),
      ).not.toBeInTheDocument();
    });
  });

  it('does not show the error view for a resolved equipment selection response', async () => {
    const executionService = createMockExecutionService([
      {
        measurementGroup: 'INITIAL_VELOCITY',
        selections: [
          {
            equipmentItemId: 10543,
            categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
            magnitude: null,
            channel: null,
            seriesIds: ['series-1'],
            shotIds: ['shot-1'],
          },
          {
            equipmentItemId: 4711,
            categoryId: EquipmentTypeEnum.ANTENNA,
            magnitude: null,
            channel: null,
            seriesIds: ['series-1'],
            shotIds: ['shot-1'],
          },
        ],
      },
      {
        measurementGroup: 'HIGH_SPEED_VIDEO',
        selections: [
          {
            equipmentItemId: 168,
            categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
            magnitude: 'ATTACK',
            channel: 2,
            seriesIds: ['series-1'],
            shotIds: ['shot-1'],
          },
        ],
      },
      {
        measurementGroup: 'PIEZOELECTRIC_PRESSURE',
        selections: [
          {
            equipmentItemId: 149,
            categoryId: EquipmentTypeEnum.AMPLIFIER,
            magnitude: null,
            channel: null,
            seriesIds: [],
            shotIds: [],
          },
        ],
      },
    ]);

    const { component } = await setup(mockData, [Role.INTAQALAB_ADMIN], createMockPlanningService(), executionService);

    expect(component.error()).toBe(false);
    expect(
      screen.queryByText('TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.ERRORS.LOAD_FAILED_TITLE'),
    ).not.toBeInTheDocument();
  });

  it('shows the empty state when no measures are planned for visible tags', async () => {
    const { component, fixture } = await setup(mockData, [Role.INTAQALAB_ADMIN], createMockPlanningService([]));
    expect(component.enabledTagIds().size).toBe(0);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(screen.getByRole('status')).toHaveTextContent(
        'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.NO_PLANNED_MEASURES',
      );
    });
  });

  it('shows one chip per visible tag for an admin role', async () => {
    const { component, fixture } = await setup();
    expect(component.visibleTags().length).toBeGreaterThan(0);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(screen.getAllByRole('option')).toHaveLength(component.visibleTags().length);
    });
  });

  it('hides all tags when the user has no matching role', async () => {
    const { component } = await setup(mockData, []);
    expect(component.visibleTags()).toEqual([]);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('auto-selects the first visible tag with one empty row', async () => {
    const { component } = await setup();
    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    expect(component.activeTagRows()).toHaveLength(1);
  });

  it('only displays planned tags and loads equipment only for enabled categories', async () => {
    const mockService = createMockExecutionService();
    const { component, fixture } = await setup(
      mockData,
      [Role.INTAQALAB_ADMIN],
      createMockPlanningService(['time'], null, ['s1']),
      mockService,
    );

    expect(component.enabledTagIds()).toEqual(new Set([EquipmentMagnitudeTagEnum.TIEMPO]));
    expect(component.visibleTags().map((tag) => tag.id)).toEqual([EquipmentMagnitudeTagEnum.TIEMPO]);
    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.TIEMPO);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByRole('option', { name: /tiempo/i })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /sonido/i })).not.toBeInTheDocument();
    });
    component.selectTag(EquipmentMagnitudeTagEnum.SONIDO);
    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.TIEMPO);
    expect(component.activeSeriesOptions().map((serie) => serie.value)).toEqual(['s1']);
    component.handleSeriesSelection(component.activeTagRows()[0].rowId, ['s2']);
    expect(component.activeTagRows()[0].series).toEqual([]);
    expect(mockService.loadEquipmentItemsByCategories).toHaveBeenCalledWith([EquipmentTypeEnum.CHRONOMETER]);
  });

  it('loads equipment lazily for the selected tag only', async () => {
    const mockService = createMockExecutionService();
    const { component, fixture } = await setup(
      mockData,
      [Role.INTAQALAB_ADMIN],
      createMockPlanningService(),
      mockService,
    );

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(mockService.loadEquipmentItemsByCategories).toHaveBeenCalledWith([
        EquipmentTypeEnum.DOPPLER_RADAR,
        EquipmentTypeEnum.ANTENNA,
      ]);
    });

    component.selectTag(EquipmentMagnitudeTagEnum.TIEMPO);

    await vi.waitFor(() => {
      expect(mockService.loadEquipmentItemsByCategories).toHaveBeenCalledWith([EquipmentTypeEnum.CHRONOMETER]);
    });
    expect(mockService.loadEquipmentItemsByCategories).toHaveBeenCalledTimes(2);
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

  it('shows shots only for selected series and rejects shots outside them', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.handleSeriesSelection(rowId, ['s1']);

    expect(component.getShotOptions(['s1']).map((shot) => shot.value)).toEqual(['d1']);
    component.setRowDisparos(rowId, ['d1', 'd2']);
    expect(component.activeTagRows()[0].disparos).toEqual(['d1']);
  });

  it('getItemsByCategory returns items loaded from the service', async () => {
    const { component } = await setup();
    // Simulate service promise resolving with mock items
    await vi.waitFor(() => component.getItemsByCategory(EquipmentTypeEnum.DOPPLER_RADAR).length > 0);
    const items = component.getItemsByCategory(EquipmentTypeEnum.DOPPLER_RADAR);
    expect(items.map((i) => i.id)).toEqual(['rd-001', 'rd-002']);
  });

  it('does not save when no equipment has changed', async () => {
    const { component } = await setup();
    component.save();
    expect(closeMock).not.toHaveBeenCalled();
  });

  it('save() collects filled rows into equipment groups', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.setFieldValue(rowId, 'radar_doppler', 'rd-001');
    component.setFieldValue(rowId, 'antena', 'ant-001');
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
              channel: null,
              magnitude: null,
              series: ['s1'],
              disparos: ['d1'],
            },
            {
              itemId: 'ant-001',
              categoryId: EquipmentTypeEnum.ANTENNA,
              channel: null,
              magnitude: null,
              series: ['s1'],
              disparos: ['d1'],
            },
          ],
        },
      ],
    });
  });

  it('prevents saving rows missing a required equipment item', async () => {
    const { component } = await setup();
    const rowId = component.activeTagRows()[0].rowId;
    component.setFieldValue(rowId, 'radar_doppler', 'rd-001');
    component.handleSeriesSelection(rowId, ['s1']);

    expect(component.canSave()).toBe(false);
    component.save();
    expect(closeMock).not.toHaveBeenCalled();
  });

  it('preserves assignments belonging to other technical units in the replacement payload', async () => {
    const executionService = createMockExecutionService([
      {
        measurementGroup: EquipmentMagnitudeTagEnum.TIEMPO,
        selections: [
          { equipmentItemId: 71, categoryId: EquipmentTypeEnum.CHRONOMETER, seriesIds: ['s1'], shotIds: ['d1'] },
        ],
      },
    ]);
    const { component } = await setup(
      mockData,
      [Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN],
      createMockPlanningService(),
      executionService,
    );

    expect(component.visibleTags().some((tag) => tag.id === EquipmentMagnitudeTagEnum.TIEMPO)).toBe(false);
    const rowId = component.activeTagRows()[0].rowId;
    component.setFieldValue(rowId, 'radar_doppler', 'rd-001');
    component.setFieldValue(rowId, 'antena', 'ant-001');
    component.handleSeriesSelection(rowId, ['s1']);
    component.save();

    const result = closeMock.mock.calls[0]?.[0];
    expect(result?.equipments.map((group: { id: string }) => group.id)).toEqual([
      EquipmentMagnitudeTagEnum.TIEMPO,
      EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
    ]);
  });

  it('hydrates rows from API data when GET resolves with equipment', async () => {
    const resolvedStatus = signal<'idle' | 'loading' | 'resolved' | 'error'>('resolved');
    const apiData = [
      {
        measurementGroup: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
        selections: [
          {
            equipmentItemId: 9876,
            equipmentDenominationId: 9876,
            categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
            seriesIds: ['s2'],
            shotIds: ['d2'],
          },
        ],
      },
    ];
    const mockService = {
      getEquipmentSelector: vi.fn(),
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue(mockItemsByCategory),
      updateEquipmentSelector: vi.fn(),
      equipmentSelectorResource: {
        status: resolvedStatus.asReadonly(),
        value: () => apiData,
        hasValue: () => true,
        error: () => null,
        isLoading: () => false,
      },
      updateEquipmentSelectorResource: {
        status: signal<'idle' | 'loading' | 'resolved' | 'error'>('idle').asReadonly(),
        isLoading: () => false,
      },
    };

    const { component } = await render(EquipmentSelectorDialog, {
      componentProviders: [{ provide: EquipmentSelectorPlanningService, useValue: createMockPlanningService() }],
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthService,
          useFactory: () => {
            const auth = new AuthService();
            auth.setRoles([Role.INTAQALAB_ADMIN]);
            return auth;
          },
        },
        { provide: ExecutionService, useValue: mockService },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      imports: [TranslateModule.forRoot()],
    }).then((v) => ({ ...v, component: v.fixture.componentInstance }));

    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    const row = component.activeTagRows()[0];
    expect(row.fieldValues['radar_doppler']).toBe('9876');
    expect(row.series).toEqual(['s2']);
    expect(row.disparos).toEqual(['d2']);
  });

  it('enables magnitude field and returns Video AV and Video C magnitudes from planning measures', async () => {
    const videoMeasuresPlanningService = {
      load: vi.fn(),
      trialMeasuresResource: {
        status: signal<'resolved'>('resolved').asReadonly(),
        value: () => ({
          series: [
            {
              seriesId: 's1',
              measures: {
                ballisticsMeasures: [
                  {
                    id: 'av-boca',
                    name: 'Vídeo Alta Velocidad en Boca',
                    magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
                  },
                  {
                    id: 'c-boca',
                    name: 'Vídeo Convencional en Boca',
                    magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
                  },
                ],
              },
            },
          ],
        }),
      },
      catalogResource: {
        status: signal<'resolved'>('resolved').asReadonly(),
        value: () => ({ items: [] }),
        isLoading: () => false,
        error: () => null,
      },
      catalog: () => [
        {
          id: 'av-boca',
          magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
          qualificationType: QualificationTypeEnum.QUANTITATIVE,
          measurements: [EquipmentMagnitudeTagEnum.VIDEO_AV],
        },
        {
          id: 'c-boca',
          magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
          qualificationType: QualificationTypeEnum.QUANTITATIVE,
          measurements: [EquipmentMagnitudeTagEnum.VIDEO_C],
        },
      ],
      isLoading: () => false,
      error: () => null,
    };

    const { component } = await setup(mockData, [Role.INTAQALAB_ADMIN], videoMeasuresPlanningService);

    expect(component.isMagnitudeFieldEnabled(EquipmentMagnitudeTagEnum.VIDEO_AV)).toBe(true);
    expect(component.isMagnitudeFieldEnabled(EquipmentMagnitudeTagEnum.VIDEO_C)).toBe(true);
    expect(component.isMagnitudeFieldEnabled(EquipmentMagnitudeTagEnum.LONGITUD)).toBe(true);
    expect(component.isMagnitudeFieldEnabled(EquipmentMagnitudeTagEnum.SONIDO)).toBe(false);

    component.selectTag(EquipmentMagnitudeTagEnum.VIDEO_AV);
    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.VIDEO_AV);
    const avMagnitudes = component.getItemsByCategory('magnitud');
    expect(avMagnitudes).toEqual([{ id: 'av-boca', label: 'Vídeo Alta Velocidad en Boca', value: 'av-boca' }]);

    component.selectTag(EquipmentMagnitudeTagEnum.VIDEO_C);
    expect(component.selectedTagId()).toBe(EquipmentMagnitudeTagEnum.VIDEO_C);
    const cMagnitudes = component.getItemsByCategory('magnitud');
    expect(cMagnitudes).toEqual([{ id: 'c-boca', label: 'Vídeo Convencional en Boca', value: 'c-boca' }]);
  });
});
