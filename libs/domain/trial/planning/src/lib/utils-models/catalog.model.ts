export type CatalogQueryParams = {
  name?: string;
  page?: number;
  pageSize?: number;
  active?: boolean;
  sort?: string[];
  munitionTypeId?: string;
};

export type SelectOption = {
  id: string;
  name: string;
  active: boolean;
  favorite?: boolean;
};

export type SpecimenItem = {
  id: string;
  name: string;
  type: 'WEAPON' | 'TUBE' | 'MUNITION';
  active: boolean;
};

export type SpecimenListResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: SpecimenItem[];
};

export type MasterDataI18nItem = {
  id: string;
  name: Record<string, string>;
  label: string;
  active: boolean;
};

export type MasterDataI18nUpdateRequest = {
  name: Record<string, string>;
  active: boolean;
};

export type MasterDataI18nListResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: MasterDataI18nItem[];
};

export type MasterDataIItem = {
  id: string;
  name: { en: string; es: string } | string;
  label: string;
  active: boolean;
};

export type MasterDataIItemUpdateRequest = {
  name: string;
  active: boolean;
};

export type MasterDataIItemListResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: MasterDataIItem[];
};

export type MeasuresMasterDataIItem = MasterDataIItem & {
  label?: string;
  favorite: boolean;
};

export type MeasuresMasterDataIItemListResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: MeasuresMasterDataIItem[];
};

export * from './measures-catalog.model';

export type WarehouseMunitionTypeItem = {
  id: string;
  category: 'MUNITION' | 'MUNITION_COMPONENT';
  name: { es: string; en: string };
  label: string;
  observations: string;
  active: boolean;
};

export type WarehouseDenominationItem = {
  id: string;
  name: string;
  category: 'MUNITION' | 'MUNITION_COMPONENT';
  munitionType: { id: string; name: string };
  neq?: number;
  unNumber?: string;
  riskGroup?: string;
  compatibility?: string;
  weight?: number;
  active: boolean;
};

export type WarehousePaginatedResponse<T> = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
};
