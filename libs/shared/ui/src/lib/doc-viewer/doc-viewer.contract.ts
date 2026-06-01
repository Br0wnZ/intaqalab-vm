import { InjectionToken, type Signal } from '@angular/core';

/**
 * Minimal contract that any document-fetching service must fulfill
 * to be used by DocViewer. This keeps the shared UI layer decoupled
 * from any domain-specific service.
 */
export interface DocViewerContract {
  viewDocumentBlob(documentId: string): void;
  resetViewDocumentBlob(): void;
  viewDocumentResource: {
    isLoading: Signal<boolean>;
    value: Signal<Blob | null | undefined>;
  };
}

export const DOC_VIEWER_SERVICE = new InjectionToken<DocViewerContract>('DOC_VIEWER_SERVICE');
