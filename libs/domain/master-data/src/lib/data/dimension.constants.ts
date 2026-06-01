import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS } from './master-data.constants';

export const DIMENSION_VIEW: MasterView = {
  title: 'MASTER_DATA.DIMENSION.TITLE',
  columnList: [
    { id: 'label', name: 'MASTER_DATA.DIMENSION.LIST.NAME' },
    { id: 'actions', name: 'MASTER_DATA.DIMENSION.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.SWITCH_STATUS, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.EDIT],
  dialogs: {
    [MASTERS_ACTIONS.DELETE]: {
      title: 'MASTER_DATA.DIMENSION.DIALOGS.DELETE.TITLE',
      description: 'MASTER_DATA.DIMENSION.DIALOGS.DELETE.DESCRIPTION',
    },
    [MASTERS_ACTIONS.SWITCH_STATUS]: {
      title: 'MASTER_DATA.DIMENSION.DIALOGS.SWITCH_STATUS.TITLE',
      description: 'MASTER_DATA.DIMENSION.DIALOGS.SWITCH_STATUS.DESCRIPTION',
    },
  },
};
