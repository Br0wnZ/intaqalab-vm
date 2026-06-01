import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS } from './master-data.constants';

export const LOADING_ZONE_VIEW: MasterView = {
  title: 'MASTER_DATA.LOADING_ZONE.TITLE',
  columnList: [
    { id: 'denomination', name: 'MASTER_DATA.LOADING_ZONE.LIST.DENOMINATION', key: 'name' },
    { id: 'zone', name: 'MASTER_DATA.LOADING_ZONE.LIST.ZONE' },
    { id: 'caliber', name: 'MASTER_DATA.LOADING_ZONE.LIST.CALIBER' },
    { id: 'actions', name: 'MASTER_DATA.LOADING_ZONE.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.SWITCH_STATUS, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.EDIT],
  dialogs: {
    [MASTERS_ACTIONS.DELETE]: {
      title: 'MASTER_DATA.LOADING_ZONE.DIALOGS.DELETE.TITLE',
      description: 'MASTER_DATA.LOADING_ZONE.DIALOGS.DELETE.DESCRIPTION',
    },
    [MASTERS_ACTIONS.SWITCH_STATUS]: {
      title: 'MASTER_DATA.LOADING_ZONE.DIALOGS.SWITCH_STATUS.TITLE',
      description: 'MASTER_DATA.LOADING_ZONE.DIALOGS.SWITCH_STATUS.DESCRIPTION',
    },
  },
};
