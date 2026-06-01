import type { MasterDataDefault } from './master-data-default.model';
import type { MasterDataDimension } from './master-data-dimension.model';
import type { MasterDataDocumentType } from './master-data-document-type.model';
import type { MasterDataLoadingZone } from './master-data-loading-zone.model';
import type { MasterDataStanag } from './master-data-stanag.model';

export type MasterDataResponseType =
  | MasterDataDefault
  | MasterDataDimension
  | MasterDataDocumentType
  | MasterDataLoadingZone
  | MasterDataStanag;

export type MasterDataUpsertDialogType<T> = Omit<T, 'id' | 'active' | 'label'>;

export type MasterDataCreateItemType<T> = Omit<T, 'id'>;
