import { MEASURE_UNIT_LABELS } from '@intaqalab/models';

import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS, MASTER_LIST_COLUMN_TRANSFORM } from './master-data.constants';

export const STANAG_VIEW: MasterView = {
  title: 'MASTER_DATA.STANAG.TITLE',
  columnList: [
    {
      id: 'variable',
      name: 'MASTER_DATA.STANAG.LIST.VARIABLE',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.TRANSLATION,
        helper: 'MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.VALUE',
      },
    },
    { id: 'label', name: 'MASTER_DATA.STANAG.LIST.DESCRIPTION' },
    { id: 'numericThreshold', name: 'MASTER_DATA.STANAG.LIST.NUM_THRESHOLD' },
    {
      id: 'unit',
      name: 'MASTER_DATA.STANAG.LIST.MEASURE_UNIT',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.ENUM,
        helper: MEASURE_UNIT_LABELS,
      },
    },
    {
      id: 'calculationType',
      name: 'MASTER_DATA.STANAG.LIST.CALC_TYPE',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.TRANSLATION,
        helper: 'MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.VALUE',
      },
    },
    {
      id: 'involvedLayer',
      name: 'MASTER_DATA.STANAG.LIST.INV_LAYERS',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.TRANSLATION,
        helper: 'MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.VALUE',
      },
    },
    { id: 'startLayer', name: 'MASTER_DATA.STANAG.LIST.START_LAYER' },
    { id: 'endLayer', name: 'MASTER_DATA.STANAG.LIST.END_LAYER' },
    { id: 'actions', name: 'MASTER_DATA.STANAG.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.EDIT, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.SWITCH_STATUS],
  dialogs: {
    [MASTERS_ACTIONS.DELETE]: {
      title: 'MASTER_DATA.STANAG.DIALOGS.DELETE.TITLE',
      description: 'MASTER_DATA.STANAG.DIALOGS.DELETE.DESCRIPTION',
    },
    [MASTERS_ACTIONS.SWITCH_STATUS]: {
      title: 'MASTER_DATA.STANAG.DIALOGS.SWITCH_STATUS.TITLE',
      description: 'MASTER_DATA.STANAG.DIALOGS.SWITCH_STATUS.DESCRIPTION',
    },
  },
};
