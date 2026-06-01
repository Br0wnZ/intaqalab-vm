import type { MASTERS_ACTIONS } from '../data/master-data.constants';

export interface MasterView {
  title: string;
  columnList: MasterViewColumn[];
  actions: MasterDataActionType[];
  dialogs: Record<Extract<MasterDataActionType, 'switch-status' | 'delete'>, { title: string; description: string }>;
}

export interface MasterViewColumn {
  id: string;
  name: string;
  key?: string;
  translation?: string;
}

// Para añadir nuevas acciones hacerlo desde master-data.constants.ts
export type MasterDataActionType = (typeof MASTERS_ACTIONS)[keyof typeof MASTERS_ACTIONS];
