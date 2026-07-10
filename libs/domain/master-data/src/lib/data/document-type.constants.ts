import type { MasterView } from '../models/master-data-view.model';
import { MASTERS_ACTIONS, MASTER_LIST_COLUMN_TRANSFORM } from './master-data.constants';

export const DOCUMENT_TYPE_VIEW: MasterView = {
  title: 'MASTER_DATA.DOCUMENT_TYPE.TITLE',
  columnList: [
    { id: 'label', name: 'MASTER_DATA.DOCUMENT_TYPE.LIST.NAME' },
    {
      id: 'category',
      name: 'MASTER_DATA.DOCUMENT_TYPE.LIST.CATEGORY.TITLE',
      transform: {
        id: MASTER_LIST_COLUMN_TRANSFORM.TRANSLATION,
        helper: 'MASTER_DATA.DOCUMENT_TYPE.LIST.CATEGORY.VALUES',
      },
    },
    { id: 'actions', name: 'MASTER_DATA.DOCUMENT_TYPE.LIST.ACTIONS' },
  ],
  actions: [MASTERS_ACTIONS.EDIT, MASTERS_ACTIONS.DELETE, MASTERS_ACTIONS.SWITCH_STATUS],
  dialogs: {
    [MASTERS_ACTIONS.DELETE]: {
      title: 'MASTER_DATA.DOCUMENT_TYPE.DIALOGS.DELETE.TITLE',
      description: 'MASTER_DATA.DOCUMENT_TYPE.DIALOGS.DELETE.DESCRIPTION',
    },
    [MASTERS_ACTIONS.SWITCH_STATUS]: {
      title: 'MASTER_DATA.DOCUMENT_TYPE.DIALOGS.SWITCH_STATUS.TITLE',
      description: 'MASTER_DATA.DOCUMENT_TYPE.DIALOGS.SWITCH_STATUS.DESCRIPTION',
    },
  },
};
