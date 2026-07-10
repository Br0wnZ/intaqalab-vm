import { MEASURE_UNIT_LABELS } from '@intaqalab/models';

import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS, MASTER_LIST_COLUMN_TRANSFORM } from './master-data.constants';

export const MEASUREMENTS_AND_RECORDS_VIEW: MasterView = {
  title: 'MASTER_DATA.MEASURES.TITLE',
  columnList: [
    { id: 'magnitudeLabel', name: 'MASTER_DATA.MEASURES.LIST.MAGNITUDE_LABEL' },
    {
      id: 'unit',
      name: 'MASTER_DATA.MEASURES.LIST.UNIT.TITLE',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.TRANSLATION,
        helper: 'MASTER_DATA.MEASURES.LIST.UNIT.VALUES',
      },
    },
    { id: 'measurementAreaCode', name: 'MASTER_DATA.MEASURES.LIST.MEASUREMENT_AREA_CODE' },
    {
      id: 'measureUnit',
      name: 'MASTER_DATA.MEASURES.LIST.MEASURE_UNIT',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.ENUM,
        helper: MEASURE_UNIT_LABELS,
      },
    },
    {
      id: 'qualificationType',
      name: 'MASTER_DATA.MEASURES.LIST.QUALIFICATION_TYPE.TITLE',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.TRANSLATION,
        helper: 'MASTER_DATA.MEASURES.LIST.QUALIFICATION_TYPE.VALUES',
      },
    },
    { id: 'maxValue', name: 'MASTER_DATA.MEASURES.LIST.MAX_VALUE' },
    { id: 'minValue', name: 'MASTER_DATA.MEASURES.LIST.MIN_VALUE' },
    {
      id: 'values',
      name: 'MASTER_DATA.MEASURES.LIST.VALUES',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.LIST_KEY,
        helper: 'label',
      },
    },
    {
      id: 'equipmentTypes',
      name: 'MASTER_DATA.MEASURES.LIST.EQUIPMENT_TYPES.TITLE',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.LIST_TRANSLATION,
        helper: 'MASTER_DATA.MEASURES.LIST.EQUIPMENT_TYPES.VALUES',
      },
    },
    { id: 'procedureLabel', name: 'MASTER_DATA.MEASURES.LIST.PROCEDURE_LABEL' },
    { id: 'accreditation', name: 'MASTER_DATA.MEASURES.LIST.ACREDITATION', status: true },
    { id: 'grubbs', name: 'MASTER_DATA.MEASURES.LIST.GRUBBS', status: true },
    { id: 'actions', name: 'MASTER_DATA.MEASURES.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.EDIT, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.SWITCH_STATUS],
  dialogs: {
    [MASTERS_ACTIONS.DELETE]: {
      title: 'MASTER_DATA.MEASURES.DIALOGS.DELETE.TITLE',
      description: 'MASTER_DATA.MEASURES.DIALOGS.DELETE.DESCRIPTION',
    },
    [MASTERS_ACTIONS.SWITCH_STATUS]: {
      title: 'MASTER_DATA.MEASURES.DIALOGS.SWITCH_STATUS.TITLE',
      description: 'MASTER_DATA.MEASURES.DIALOGS.SWITCH_STATUS.DESCRIPTION',
    },
  },
};

export const MEASUREMENTS_AND_RECORDS_UNITS = [
  { id: 'TOPOGRAPHY', label: 'MASTER_DATA.MEASURES.LIST.UNIT.VALUES.TOPOGRAPHY' },
  { id: 'MUNITIONS', label: 'MASTER_DATA.MEASURES.LIST.UNIT.VALUES.MUNITIONS' },
  { id: 'ARMAMENT', label: 'MASTER_DATA.MEASURES.LIST.UNIT.VALUES.ARMAMENT' },
  { id: 'BALLISTICS', label: 'MASTER_DATA.MEASURES.LIST.UNIT.VALUES.BALLISTICS' },
];
