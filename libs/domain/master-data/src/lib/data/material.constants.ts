import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS } from './master-data.constants';

export const MATERIAL_VIEW: MasterView = {
  title: 'MASTER_DATA.MATERIAL.TITLE',
  columnList: [
    { id: 'label', name: 'MASTER_DATA.MATERIAL.LIST.NAME' },
    { id: 'actions', name: 'MASTER_DATA.MATERIAL.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.EDIT, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.SWITCH_STATUS],
  dialogs: {
    [MASTERS_ACTIONS.DELETE]: {
      title: 'MASTER_DATA.MATERIAL.DIALOGS.DELETE.TITLE',
      description: 'MASTER_DATA.MATERIAL.DIALOGS.DELETE.DESCRIPTION',
    },
    [MASTERS_ACTIONS.SWITCH_STATUS]: {
      title: 'MASTER_DATA.MATERIAL.DIALOGS.SWITCH_STATUS.TITLE',
      description: 'MASTER_DATA.MATERIAL.DIALOGS.SWITCH_STATUS.DESCRIPTION',
    },
  },
};
