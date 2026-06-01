import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { DOC_VIEWER_SERVICE } from './doc-viewer.contract';

export interface DocViewerData {
  documentId: string;
  documentName: string;
}

@Component({
  selector: 'ui-doc-viewer',
  imports: [PdfViewerModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <h2 mat-dialog-title class="!m-0 text-lg font-medium text-gray-900 truncate pr-4">
        {{ data.documentName }}
      </h2>
      <button mat-icon-button class="text-gray-500 hover:text-gray-700" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="!p-0 bg-gray-100 relative min-h-[600px] flex">
      @if (pdfSrc()) {
        <pdf-viewer
          class="block w-full h-[70vh] min-h-[600px]"
          [src]="pdfSrc()!"
          [render-text]="true"
          [original-size]="false"
        ></pdf-viewer>
      } @else if (docsService.viewDocumentResource.isLoading()) {
        <div
          class="flex flex-col flex-1 items-center justify-center m-4 rounded border bg-gray-50 shadow-sm min-h-[600px]"
        >
          <mat-icon class="animate-spin text-gray-400 mb-2">refresh</mat-icon>
          <p class="text-gray-500">Cargando documento...</p>
        </div>
      } @else {
        <div
          class="flex flex-1 items-center justify-center m-4 rounded border bg-gray-50 shadow-sm text-center p-4 min-h-[600px]"
        >
          <p class="text-gray-500">Ningún documento seleccionado o el formato no es soportado (debe ser PDF)</p>
        </div>
      }
    </mat-dialog-content>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocViewer {
  readonly docsService = inject(DOC_VIEWER_SERVICE);
  readonly data = inject<DocViewerData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<DocViewer>);

  readonly pdfSrc = signal<string | null>(null);

  constructor() {
    // Solicitamos la descarga de este documento específico para visor
    this.docsService.viewDocumentBlob(this.data.documentId);

    effect((onCleanup) => {
      const blob = this.docsService.viewDocumentResource.value();

      if (blob instanceof Blob) {
        const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        const localUrl = URL.createObjectURL(pdfBlob);
        this.pdfSrc.set(localUrl);

        onCleanup(() => {
          URL.revokeObjectURL(localUrl);
        });
      } else {
        this.pdfSrc.set(null);
      }
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.docsService.resetViewDocumentBlob();
    });
  }

  close() {
    this.dialogRef.close();
  }
}
