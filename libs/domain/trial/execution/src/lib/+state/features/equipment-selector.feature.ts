import { computed, effect, inject, untracked } from '@angular/core';
import { patchState, signalStoreFeature, type, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type {
  EquipmentItemSelection,
  EquipmentMagnitudeSelectionGroup,
  EquipmentMeasurementGroupApi,
  EquipmentSelectionApiList,
} from '../../execution/models';
import { EquipmentMagnitudeTagEnum, EquipmentTypeEnum, isEquipmentTypeEnum } from '../../execution/models';
import { ExecutionService, type PlanningSeriesItem } from '../../services/execution.service';
import type { EquipmentSelectorState } from '../execution-state.models';

function flattenGroupedEquipments(equipments: EquipmentMagnitudeSelectionGroup[]): EquipmentItemSelection[] {
  return equipments.flatMap((group) => group.selections ?? []);
}

function extractDenominationId(itemId: string): number | null {
  const direct = Number(itemId);
  if (Number.isFinite(direct)) return direct;

  const numericSuffix = itemId.match(/(\d+)$/)?.[1];
  if (!numericSuffix) return null;

  const parsed = Number(numericSuffix);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveItemIdFromDenomination(
  denominationId: number,
  items: EquipmentSelectorState['items'],
  categoryId?: EquipmentTypeEnum,
): string {
  const candidateItems = categoryId
    ? items.filter((item) => item.equipmentType === categoryId || item.categoryId === categoryId)
    : items;

  const searchList = candidateItems.length ? candidateItems : items;

  const byDirect = searchList.find((item) => Number(item.id) === denominationId)?.id;
  if (byDirect) return byDirect;

  const bySuffix = searchList.find((item) => item.id.endsWith(`-${denominationId}`))?.id;
  if (bySuffix) return bySuffix;

  const paddedStr = String(denominationId).padStart(2, '0');
  const byPadded = searchList.find((item) => item.id.endsWith(`-${paddedStr}`))?.id;
  if (byPadded) return byPadded;

  return String(denominationId);
}

function toEquipmentSelectionApi(equipments: EquipmentMagnitudeSelectionGroup[]): EquipmentSelectionApiList {
  return equipments.map((group) => ({
    measurementGroup: group.id,
    selections: group.selections
      .map((selection) => {
        const equipmentDenominationId = extractDenominationId(selection.itemId);
        if (equipmentDenominationId === null) {
          return null;
        }

        return {
          equipmentDenominationId,
          categoryId: selection.categoryId,
          magnitude: selection.magnitude ?? null,
          channel: selection.channel ?? null,
          seriesIds: selection.series,
          shotIds: selection.disparos,
        };
      })
      .filter((selection): selection is NonNullable<typeof selection> => selection !== null),
  }));
}

function fromEquipmentSelectionApi(
  apiGroups: EquipmentSelectionApiList,
  items: EquipmentSelectorState['items'],
): EquipmentMagnitudeSelectionGroup[] {
  if (!Array.isArray(apiGroups)) {
    return [];
  }
  return apiGroups.map((group: EquipmentMeasurementGroupApi) => ({
    id: group.measurementGroup,
    selections: group.selections
      .filter((selection) => isEquipmentTypeEnum(selection.categoryId))
      .map((selection) => ({
        itemId: resolveItemIdFromDenomination(selection.equipmentDenominationId, items, selection.categoryId),
        categoryId: selection.categoryId as EquipmentTypeEnum,
        magnitude: selection.magnitude ?? null,
        channel: selection.channel ?? null,
        series: selection.seriesIds ?? [],
        disparos: selection.shotIds ?? selection.shootIds ?? [],
      })),
  }));
}

function buildSeriesSelectionData(
  planningSeries: PlanningSeriesItem[] | null | undefined,
): Pick<EquipmentSelectorState, 'serieOptions' | 'disparoOptions' | 'serieDisparoMap'> {
  if (!planningSeries?.length) {
    return {
      serieOptions: [],
      disparoOptions: [],
      serieDisparoMap: {},
    };
  }

  const serieOptions = planningSeries.map((serie, index) => ({
    value: serie.id,
    label: serie.name?.trim() || `Serie ${serie.executionOrder ?? index + 1}`,
  }));

  const seenShotIds = new Set<string>();
  const disparoOptions: EquipmentSelectorState['disparoOptions'] = [];
  const serieDisparoMap: Record<string, string[]> = {};

  planningSeries.forEach((serie, serieIndex) => {
    const shots = serie.shots ?? [];

    serieDisparoMap[serie.id] = shots.map((shot, shotIndex) => {
      if (!seenShotIds.has(shot.id)) {
        disparoOptions.push({
          value: shot.id,
          label: `Disparo ${shot.globalNumber ?? shotIndex + 1}`,
        });
        seenShotIds.add(shot.id);
      }

      return shot.id;
    });

    if (!shots.length && !(serie.id in serieDisparoMap)) {
      serieDisparoMap[serie.id] = [];
    }

    if (!serie.name?.trim() && serieOptions[serieIndex]) {
      serieOptions[serieIndex] = {
        value: serie.id,
        label: `Serie ${serie.executionOrder ?? serieIndex + 1}`,
      };
    }
  });

  return {
    serieOptions,
    disparoOptions,
    serieDisparoMap,
  };
}

interface EquipmentSelectorSlice {
  equipmentSelector: EquipmentSelectorState;
}

const initialState: EquipmentSelectorSlice = {
  equipmentSelector: {
    categories: [
      { id: 'radar-dopler', label: 'Radar Dopler', maxSelection: 3 },
      { id: 'sensor-piezoelectrico', label: 'Sensor Piezoelectrico', maxSelection: 2 },
      { id: 'amplificador', label: 'Amplificador', maxSelection: 5 },
      { id: 'antena', label: 'Antena', maxSelection: 1 },
    ],
    items: [
      {
        id: 'rd-2356',
        label: 'Radar doppler 2356',
        categoryId: 'radar-dopler',
        equipmentType: 'DOPPLER_RADAR',
      },
      {
        id: 'rd-9876',
        label: 'Radar doppler 9876',
        categoryId: 'radar-dopler',
        equipmentType: 'DOPPLER_RADAR',
      },
      {
        id: 'rd-4321',
        label: 'Radar doppler 4321',
        categoryId: 'radar-dopler',
        equipmentType: 'DOPPLER_RADAR',
      },
      {
        id: 'rd-5566',
        label: 'Radar doppler 5566',
        categoryId: 'radar-dopler',
        equipmentType: 'DOPPLER_RADAR',
      },
      {
        id: 'rd-8899',
        label: 'Radar doppler 8899',
        categoryId: 'radar-dopler',
        equipmentType: 'DOPPLER_RADAR',
      },
      {
        id: 'sp-01',
        label: 'Sensor Piezoelectrico 01',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      {
        id: 'sp-02',
        label: 'Sensor Piezoelectrico 02',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      {
        id: 'sp-03',
        label: 'Sensor Piezoelectrico 03',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      {
        id: 'sp-04',
        label: 'Sensor Piezoelectrico 04',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      {
        id: 'sp-05',
        label: 'Sensor Piezoelectrico 05',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      {
        id: 'sp-06',
        label: 'Sensor Piezoelectrico 06',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      {
        id: 'sp-07',
        label: 'Sensor Piezoelectrico 07',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      {
        id: 'sp-08',
        label: 'Sensor Piezoelectrico 08',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: 'PIEZOELECTRIC_SENSOR',
      },
      { id: 'amp-01', label: 'Amplificador 01', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-02', label: 'Amplificador 02', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-03', label: 'Amplificador 03', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-04', label: 'Amplificador 04', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-05', label: 'Amplificador 05', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-06', label: 'Amplificador 06', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-07', label: 'Amplificador 07', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-08', label: 'Amplificador 08', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-09', label: 'Amplificador 09', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'amp-10', label: 'Amplificador 10', categoryId: 'amplificador', equipmentType: 'AMPLIFIER' },
      { id: 'ant-01', label: 'Antena 01', categoryId: 'antena', equipmentType: 'ANTENNA' },
      { id: 'ant-02', label: 'Antena 02', categoryId: 'antena', equipmentType: 'ANTENNA' },
      { id: 'ant-03', label: 'Antena 03', categoryId: 'antena', equipmentType: 'ANTENNA' },
      { id: 'ant-04', label: 'Antena 04', categoryId: 'antena', equipmentType: 'ANTENNA' },
      { id: 'ant-05', label: 'Antena 05', categoryId: 'antena', equipmentType: 'ANTENNA' },
      { id: 'ant-06', label: 'Antena 06', categoryId: 'antena', equipmentType: 'ANTENNA' },
      { id: 'ant-07', label: 'Antena 07', categoryId: 'antena', equipmentType: 'ANTENNA' },
      { id: 'ant-08', label: 'Antena 08', categoryId: 'antena', equipmentType: 'ANTENNA' },
      {
        id: 'son-01',
        label: 'Sonómetro Norsonic 140 / SN001',
        categoryId: 'sonometro',
        equipmentType: 'SOUND_LEVEL_METER',
      },
      {
        id: 'son-02',
        label: 'Sonómetro Norsonic 145 / SN002',
        categoryId: 'sonometro',
        equipmentType: 'SOUND_LEVEL_METER',
      },
      {
        id: 'son-03',
        label: 'Sonómetro Brüel & Kjær 2270 / SN003',
        categoryId: 'sonometro',
        equipmentType: 'SOUND_LEVEL_METER',
      },
    ],
    equipments: [
      {
        id: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
        selections: [
          {
            itemId: 'rd-9876',
            categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
            series: ['funcionamiento-1'],
            disparos: ['disparo-1', 'disparo-2'],
          },
          {
            itemId: 'rd-4321',
            categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
            series: ['funcionamiento-1'],
            disparos: ['disparo-1', 'disparo-2'],
          },
          {
            itemId: 'ant-01',
            categoryId: EquipmentTypeEnum.ANTENNA,
            series: ['funcionamiento-1'],
            disparos: ['disparo-1', 'disparo-2'],
          },
        ],
      },
      {
        id: EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS,
        selections: [
          {
            itemId: 'sp-01',
            categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
            series: ['funcionamiento-1'],
            disparos: ['disparo-1', 'disparo-2'],
          },
          {
            itemId: 'amp-01',
            categoryId: EquipmentTypeEnum.AMPLIFIER,
            series: ['funcionamiento-1'],
            disparos: ['disparo-1', 'disparo-2'],
          },
        ],
      },
      {
        id: EquipmentMagnitudeTagEnum.SONIDO,
        selections: [
          {
            itemId: 'son-01',
            categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
            series: ['funcionamiento-2'],
            disparos: ['disparo-3'],
          },
        ],
      },
    ],
    selections: [
      {
        itemId: 'rd-9876',
        categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
        series: ['funcionamiento-1'],
        disparos: ['disparo-1', 'disparo-2'],
      },
      {
        itemId: 'rd-4321',
        categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
        series: ['funcionamiento-1'],
        disparos: ['disparo-1', 'disparo-2'],
      },
      {
        itemId: 'ant-01',
        categoryId: EquipmentTypeEnum.ANTENNA,
        series: ['funcionamiento-1'],
        disparos: ['disparo-1', 'disparo-2'],
      },
      {
        itemId: 'sp-01',
        categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
        series: ['funcionamiento-1'],
        disparos: ['disparo-1', 'disparo-2'],
      },
      {
        itemId: 'amp-01',
        categoryId: EquipmentTypeEnum.AMPLIFIER,
        series: ['funcionamiento-1'],
        disparos: ['disparo-1', 'disparo-2'],
      },
      {
        itemId: 'son-01',
        categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
        series: ['funcionamiento-2'],
        disparos: ['disparo-3'],
      },
    ],
    serieOptions: [],
    disparoOptions: [],
    serieDisparoMap: {},
  },
};

export function withEquipmentSelector() {
  return signalStoreFeature(
    { state: type<{ fireTrialId: string | null }>() },
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      // Equipment Selector
      equipmentSelectorRemote: computed(() => executionService.equipmentSelectorResource.value()),

      isLoadingEquipmentSelector: computed(() => executionService.equipmentSelectorResource.isLoading()),

      isUpdatingEquipmentSelector: computed(() => executionService.updateEquipmentSelectorResource.isLoading()),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      /** Persiste las selecciones del diálogo selector de equipos */
      updateEquipmentSelections(equipments: EquipmentMagnitudeSelectionGroup[]): void {
        const fireTrialId = store.fireTrialId();
        const flattenedSelections = flattenGroupedEquipments(equipments);
        if (fireTrialId) {
          executionService.updateEquipmentSelector(fireTrialId, toEquipmentSelectionApi(equipments));
        }
        patchState(store, (state) => ({
          equipmentSelector: {
            ...state.equipmentSelector,
            equipments,
            selections: flattenedSelections,
          },
        }));
      },
    })),
    withHooks({
      onInit(store) {
        const executionService = inject(ExecutionService);

        effect(() => {
          const remote = store.equipmentSelectorRemote();
          if (!remote) return;

          // Leer items fuera del grafo reactivo para evitar el loop:
          // patchState → equipmentSelector cambia → effect re-dispara → loop infinito
          const items = untracked(() => store.equipmentSelector().items);
          const equipments = fromEquipmentSelectionApi(remote, items);

          patchState(store, (state) => ({
            equipmentSelector: {
              ...state.equipmentSelector,
              equipments,
              selections: flattenGroupedEquipments(equipments),
            },
          }));
        });

        let lastUpdateStatus = executionService.updateEquipmentSelectorResource.status();

        effect(() => {
          const updateStatus = executionService.updateEquipmentSelectorResource.status();
          const fireTrialId = store.fireTrialId();

          if (updateStatus === 'resolved' && lastUpdateStatus !== 'resolved' && fireTrialId) {
            executionService.getEquipmentSelector(fireTrialId);
          }

          lastUpdateStatus = updateStatus;
        });

        effect(() => {
          const planningSeries = executionService.planningSeriesResource.value();
          const seriesSelectionData = buildSeriesSelectionData(planningSeries);

          patchState(store, (state) => ({
            equipmentSelector: {
              ...state.equipmentSelector,
              ...seriesSelectionData,
            },
          }));
        });
      },
    }),
  );
}
