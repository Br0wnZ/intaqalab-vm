import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS } from './master-data.constants';

export const STANAG_VIEW: MasterView = {
  title: 'MASTER_DATA.STANAG.TITLE',
  columnList: [
    { id: 'variable', name: 'MASTER_DATA.STANAG.LIST.VARIABLE', key: 'name' },
    { id: 'description', name: 'MASTER_DATA.STANAG.LIST.DESCRIPTION' },
    { id: 'active', name: 'MASTER_DATA.STANAG.LIST.ACTIVE' },
    { id: 'numThreshold', name: 'MASTER_DATA.STANAG.LIST.NUM_THRESHOLD' },
    { id: 'measureUnit', name: 'MASTER_DATA.STANAG.LIST.MEASURE_UNIT', key: 'name' },
    { id: 'calcType', name: 'MASTER_DATA.STANAG.LIST.CALC_TYPE', key: 'name' },
    { id: 'involvedLayers', name: 'MASTER_DATA.STANAG.LIST.INV_LAYERS', key: 'name' },
    { id: 'startLayer', name: 'MASTER_DATA.STANAG.LIST.START_LAYER' },
    { id: 'endLayer', name: 'MASTER_DATA.STANAG.LIST.END_LAYER' },
    { id: 'actions', name: 'MASTER_DATA.STANAG.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.SWITCH_STATUS, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.EDIT],
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
