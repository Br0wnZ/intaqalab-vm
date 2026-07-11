import { computed, effect, inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { EquipmentItemSelection, EquipmentMagnitudeSelectionGroup } from '../../execution/models';
import { EquipmentMagnitudeTagEnum } from '../../execution/models';
import { ExecutionService } from '../../services/execution.service';
import type { EquipmentSelectorState } from '../execution-state.models';

function flattenGroupedEquipments(equipments: EquipmentMagnitudeSelectionGroup[]): EquipmentItemSelection[] {
  return equipments.flatMap((group) => group.selections ?? []);
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
          { itemId: 'rd-9876', categoryId: 'DOPPLER_RADAR', series: [], disparos: [] },
          { itemId: 'rd-4321', categoryId: 'DOPPLER_RADAR', series: [], disparos: [] },
          { itemId: 'rd-8899', categoryId: 'DOPPLER_RADAR', series: [], disparos: [] },
        ],
      },
    ],
    selections: [
      { itemId: 'rd-9876', categoryId: 'radar-dopler', series: [], disparos: [] },
      { itemId: 'rd-4321', categoryId: 'radar-dopler', series: [], disparos: [] },
      { itemId: 'rd-8899', categoryId: 'radar-dopler', series: [], disparos: [] },
    ],
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    serieDisparoMap: {
      'funcionamiento-1': ['disparo-1', 'disparo-2'],
      'funcionamiento-2': ['disparo-3'],
    },
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
      loadEquipmentSelector(fireTrialId: string): void {
        executionService.getEquipmentSelector(fireTrialId);
      },

      /** Persiste las selecciones del diálogo selector de equipos */
      updateEquipmentSelections(equipments: EquipmentMagnitudeSelectionGroup[]): void {
        const fireTrialId = store.fireTrialId();
        const flattenedSelections = flattenGroupedEquipments(equipments);
        if (fireTrialId) {
          executionService.updateEquipmentSelector(fireTrialId, { equipments });
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
        const fireTrialId = store.fireTrialId();
        if (fireTrialId) {
          store.loadEquipmentSelector(fireTrialId);
        }

        effect(() => {
          const remote = store.equipmentSelectorRemote();
          if (!remote) return;

          patchState(store, (state) => ({
            equipmentSelector: {
              ...state.equipmentSelector,
              categories: remote.categories,
              items: remote.items.map((item) => ({
                id: item.id,
                label: item.label,
                categoryId: item.categoryId ?? item.equipmentType ?? '',
                equipmentType: item.equipmentType,
              })),
              equipments: remote.equipments,
              selections: flattenGroupedEquipments(remote.equipments),
              serieOptions: remote.serieOptions,
              disparoOptions: remote.disparoOptions,
              serieDisparoMap: remote.serieDisparoMap,
            },
          }));
        });
      },
    }),
  );
}
