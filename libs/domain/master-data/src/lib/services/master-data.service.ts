import type { HttpResourceRef } from '@angular/common/http';
import type { WritableSignal } from '@angular/core';
import type { PaginatedApiResponse, PaginatedSortedViewRequest } from '@intaqalab/models';

import type { MasterDataDefault } from '../models/master-data-default.model';
import type { MasterDataCreateItemType } from '../models/utils.model';

export type MasterDataSearchRequest = PaginatedSortedViewRequest & {
  filters?: Readonly<Record<string, string>>;
};

export abstract class MasterDataService<T = MasterDataDefault> {
  abstract readonly searchItems: WritableSignal<MasterDataSearchRequest>;
  abstract readonly paginatedResponse: HttpResourceRef<PaginatedApiResponse<T> | undefined>;

  abstract create(record: MasterDataCreateItemType<T>): void;
  abstract update(record: T): void;
  abstract delete(id: string | number | T): void;

  abstract resetUpsert(): void;
  abstract resetSwitchStatus(): void;
  abstract resetDelete(): void;

  abstract readonly saveResource: HttpResourceRef<T | undefined>;
  abstract readonly updateResource: HttpResourceRef<T | undefined>;
  abstract readonly deleteById: HttpResourceRef<T | undefined>;
}
