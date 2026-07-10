import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS } from './master-data.constants';

export const TRIAL_TYPE_VIEW: MasterView = {
  title: 'MASTER_DATA.TRIAL_TYPE.TITLE',
  columnList: [
    { id: 'label', name: 'MASTER_DATA.TRIAL_TYPE.LIST.NAME' },
    { id: 'actions', name: 'MASTER_DATA.TRIAL_TYPE.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.EDIT, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.SWITCH_STATUS],
  dialogs: {
    [MASTERS_ACTIONS.DELETE]: {
      title: 'MASTER_DATA.TRIAL_TYPE.DIALOGS.DELETE.TITLE',
      description: 'MASTER_DATA.TRIAL_TYPE.DIALOGS.DELETE.DESCRIPTION',
    },
    [MASTERS_ACTIONS.SWITCH_STATUS]: {
      title: 'MASTER_DATA.TRIAL_TYPE.DIALOGS.SWITCH_STATUS.TITLE',
      description: 'MASTER_DATA.TRIAL_TYPE.DIALOGS.SWITCH_STATUS.DESCRIPTION',
    },
  },
};
