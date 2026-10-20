/**
 * Warehouse API DTOs and Enums based on `warehouse-api.json`.
 * Strict typing: Zero `any`.
 */

export type MunitionCategoryEnum = 'MUNITION' | 'MUNITION_COMPONENT';

export type StockStatusEnum = 'AVAILABLE' | 'RETIRED';

export type RiskGroupEnum = '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6';

export type CompatibilityEnum = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L' | 'N' | 'S';

export interface NameI18n {
  es?: string;
  en?: string;
}

export interface PagedMetadata {
  page: number;
  pageSize: number;
  totalElements: number;
}

export interface PagedResponse<T> {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
}

export interface StockReferenceItem {
  id: string;
  name: string;
}

export interface MunitionTypeItem {
  id: string;
  category: MunitionCategoryEnum;
  name?: NameI18n | string;
  label?: string;
  observations?: string;
  active: boolean;
}

export interface DenominationItem {
  id: string;
  category: MunitionCategoryEnum;
  munitionType?: StockReferenceItem | null;
  name: string;
  neq?: number;
  unNumber?: string;
  weight?: number;
  active: boolean;
}

export interface StockListItem {
  id: string;
  category: MunitionCategoryEnum;
  munitionType?: StockReferenceItem | null;
  denomination?: StockReferenceItem | null;
  client?: StockReferenceItem | null;
  batch: string;
  cellName?: string;
  status: StockStatusEnum;
  quantity: number;
  totalNeq?: number;
}
