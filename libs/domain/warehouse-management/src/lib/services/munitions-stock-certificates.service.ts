import { httpResource } from '@angular/common/http';
import { Injectable, effect, signal } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { CertificateApiResponse } from '../models/certificates.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class MunitionsStockCertificatesService {
  #resource = injectWarehouseResource<CertificateApiResponse, CertificateApiResponse>(
    `${injectWharehouseEndpoint()}/stock`,
  );

  readonly deleteResource = this.#resource.deleteResource;
  readonly response = this.#resource.response;

  constructor() {
    effect(() => {
      const update = this.uploadDocumentResource.statusCode();
      const deleteId = this.deleteDocumentResource.statusCode();
      const munitionCertificateLinkResource = this.munitionCertificateLinkResource.statusCode();

      if (munitionCertificateLinkResource || update || deleteId) this.response.reload();
    });
  }

  searchById(id: string): void {
    const idWithEndpoint = `${id}/certificates`;
    this.#resource.searchById(idWithEndpoint);
  }

  readonly #whareHouseUrl = injectWharehouseEndpoint();

  deleteItem(itemId: string, certId: string): void {
    const params = `${itemId}/certificates/${certId}`;
    this.#deleteDocumentSrc.set(params);
  }

  readonly #uploadParams = signal<{ stockId: string; file: File } | undefined>(undefined);
  uploadDocument(stockId: string, file: File): void {
    this.#uploadParams.set({ stockId, file });
  }

  readonly uploadDocumentResource = httpResource(() => {
    const params = this.#uploadParams();
    if (!params) return undefined;

    const formData = new FormData();
    formData.append('file', params.file);
    // formData.append('documentTypeId', params.documentTypeId);
    return {
      url: `${this.#whareHouseUrl}/stock/${params.stockId}/certificates`,
      method: 'POST',
      body: formData,
      reportProgress: true,
    };
  });

  link = signal<{ certId: string; munitionIds: string[] } | undefined>(undefined);
  readonly munitionCertificateLinkResource = httpResource<CertificateApiResponse>(() => {
    const link = this.link();
    if (!link) return undefined;
    const { munitionIds, certId } = link;
    return {
      url: `${this.#whareHouseUrl}/stock/certificates/${certId}/munitions`,
      method: 'PUT',
      body: {
        munitionIds,
      },
    };
  });

  #deleteDocumentSrc = signal<string | undefined>(undefined);
  readonly deleteDocumentResource = httpResource(() => {
    const params = this.#deleteDocumentSrc();
    if (!params) return undefined;

    return {
      url: `${this.#whareHouseUrl}/stock/${params}`,
      method: 'DELETE',
    };
  });
}
