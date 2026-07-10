import type { MASTERS_ACTIONS, MASTER_LIST_COLUMN_TRANSFORM } from '../data/master-data.constants';

export interface MasterView {
  title: string;
  columnList: MasterViewColumn[];
  actions: MasterDataActionType[];
  dialogs: Record<Extract<MasterDataActionType, 'switch-status' | 'delete'>, { title: string; description: string }>;
}

export interface MasterViewColumn {
  id: string;
  name: string;
  transform?: MasterViewColumnTransform;
  status?: boolean;
}

export interface MasterViewColumnTransform {
  id: MasterDataListTransformType;
  helper: unknown;
}

export type MasterDataListTransformType =
  (typeof MASTER_LIST_COLUMN_TRANSFORM)[keyof typeof MASTER_LIST_COLUMN_TRANSFORM];

export type MasterDataActionType = (typeof MASTERS_ACTIONS)[keyof typeof MASTERS_ACTIONS];
