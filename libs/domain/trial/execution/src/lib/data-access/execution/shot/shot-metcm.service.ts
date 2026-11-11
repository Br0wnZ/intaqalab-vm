import { HttpParams, httpResource } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { injectDocumentsEndpoint, injectExecutionEndpoint } from '@intaqalab/config';

import type { FireTrialMetcmDocumentsResponse, ShotMetcmResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

const METCM_DOCUMENT_TYPE_ID = 'd8869239-caee-4c21-a462-ad538b9d84cd';

interface ShotMetcmParams {
  seriesId: string;
  shotId: string;
}

@Injectable({ providedIn: 'root' })
export class ShotMetcmService {
  readonly #documentsUrl = injectDocumentsEndpoint();
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #fireTrialId = signal<string | null>(null);
  readonly #shotParams = signal<ShotMetcmParams | null>(null);
  readonly shotParams = this.#shotParams.asReadonly();

  readonly #documentsResource = httpResource<FireTrialMetcmDocumentsResponse>(() => {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) return undefined;

    return {
      url: `${this.#documentsUrl}/fire-trials/${encodeURIComponent(fireTrialId)}/documents`,
      method: 'GET',
      params: new HttpParams()
        .set('typeId', METCM_DOCUMENT_TYPE_ID)
        .set('status', 'ACTIVE')
        .set('page', '1')
        .set('pageSize', '200'),
    };
  });

  readonly shotMetcmResource = httpResource<ShotMetcmResponse>(() => {
    const params = this.#shotParams();
    const fireTrialId = this.#fireTrialId();
    const documents = this.#documentsResource.value();
    if (!params || !fireTrialId || !documents || this.#documentsResource.isLoading()) return undefined;

    const document = documents.items.find(
      (item) => item.type.id === METCM_DOCUMENT_TYPE_ID && item.status === 'ACTIVE',
    );
    if (!document) return undefined;

    return {
      url: executionTrialUrl(
        this.#executionUrl,
        fireTrialId,
        'metcm',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
      params: { documentId: document.id },
    };
  });

  readonly isLoading = computed(() => this.#documentsResource.isLoading() || this.shotMetcmResource.isLoading());

  readonly error = computed(() => {
    const documentsError = this.#documentsResource.error();
    if (documentsError) return documentsError;

    const documents = this.#documentsResource.value();
    if (
      documents &&
      !documents.items.some((item) => item.type.id === METCM_DOCUMENT_TYPE_ID && item.status === 'ACTIVE')
    ) {
      return new Error('Active METCM document not found for fire trial');
    }

    return this.shotMetcmResource.error();
  });

  loadShotMetcm(fireTrialId: string, seriesId: string, shotId: string): void {
    this.#fireTrialId.set(fireTrialId);
    this.#shotParams.set({ seriesId, shotId });
  }

  resetShotMetcm(): void {
    this.#fireTrialId.set(null);
    this.#shotParams.set(null);
  }
}
