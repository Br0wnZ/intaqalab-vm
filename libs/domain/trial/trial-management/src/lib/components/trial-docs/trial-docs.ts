import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { FireTrial, TrialDocsFilter } from '@intaqalab/models';
import { TrialDocsStatus, injectTrialDocsCategory, injectTrialDocsStatus } from '@intaqalab/models';
import { DOC_VIEWER_SERVICE, DocViewer, IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { IntaDatePipe } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TrialDocsService } from '../../services/trial-docs-service';
import type { FireTrialDocument } from '../../utils-models/documents-service.model';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog/confirm-delete-dialog';
import { DownloadRequiredDialogComponent } from './download-required-dialog/download-required-dialog';
import { TrialDocsFilePicker } from './trial-docs-file-picker/trial-docs-file-picker';

const DISPLAYED_COLUMNS = ['fileName', 'status', 'version', 'category', 'type', 'createdAt', 'acciones'];

enum TrialDocsViewState {
  LOADING = 'LOADING',
  EMPTY = 'EMPTY',
  NO_RESULTS = 'NO_RESULTS',
  HAS_DATA = 'HAS_DATA',
}

@Component({
  selector: 'inta-trial-docs',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatTooltipModule,
    IntaSignalSelectComponent,
    FormField,
    IntaDatePipe,
    IntaIconComponent,
  ],
  template: `
    <div class="w-full">
      <!-- Estado: Sin documentos (primera carga vacía sin filtros) -->
      @if (viewState() === trialsDocsViewState.EMPTY) {
        <div class="w-full">
          <label for="documentacion-input" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_DOCS.LABEL' | translate }}
          </label>

          <div
            class="relative border-2 border-dashed border-gray-300 rounded-lg p-12 flex items-center justify-center bg-white hover:border-gray-400 transition-colors"
          >
            <input
              id="documentacion-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              class="hidden"
              (change)="openFilePickerDialog()"
              #fileInput
            />

            <div class="flex flex-col items-center gap-4">
              <button
                type="button"
                class="flex items-center gap-2 bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] cursor-pointer text-white px-6 py-2.5 rounded-lg font-medium"
                (click)="openFilePickerDialog()"
              >
                <mat-icon class="text-white">add</mat-icon>
                {{ 'TRIAL_DOCS.ADD_DOC' | translate }}
              </button>
              <p class="text-sm text-gray-500">{{ 'TRIAL_DOCS.DRAG_HERE' | translate }}</p>
            </div>
          </div>
        </div>
      }

      <!-- Estado: Cargando, con datos o sin resultados por filtros -->
      @if (
        viewState() === trialsDocsViewState.LOADING ||
        viewState() === trialsDocsViewState.HAS_DATA ||
        viewState() === trialsDocsViewState.NO_RESULTS
      ) {
        <div class="w-full bg-white rounded-lg border border-gray-200">
          <div class="p-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-medium text-gray-900">
                {{ 'TRIAL_DOCS.LABEL' | translate }}
              </h3>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <mat-slide-toggle
                    color="primary"
                    [checked]="showOnlyActive()"
                    (change)="onToggleShowOnlyActive($event.checked)"
                  ></mat-slide-toggle>
                  <span class="text-sm text-gray-700">{{ 'TRIAL_DOCS.FILTERS.SHOW_ACTIVE_ONLY' | translate }}</span>
                </div>

                <button mat-flat-button (click)="openFilePickerDialog()">
                  <mat-icon>add</mat-icon>
                  {{ 'TRIAL_DOCS.ADD_DOC' | translate }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ui-inta-signal-select
                appearance="outline"
                [id]="'trial-status'"
                [valueKey]="'value'"
                [labelKey]="'label'"
                [formField]="docsForm.status"
                [label]="'TRIAL_DOCS.FILTERS.STATUS' | translate"
                [placeholder]="'TRIAL_DOCS.FILTERS.STATUS_PLACEHOLDER' | translate"
                [options]="docsStatus()"
              />

              <ui-inta-signal-select
                appearance="outline"
                [id]="'trial-status'"
                [valueKey]="'value'"
                [labelKey]="'label'"
                [formField]="docsForm.category"
                [label]="'TRIAL_DOCS.FILTERS.CATEGORY' | translate"
                [placeholder]="'TRIAL_DOCS.FILTERS.CATEGORY_PLACEHOLDER' | translate"
                [options]="docsCategory()"
              />

              <ui-inta-signal-select
                appearance="outline"
                [id]="'trial-status'"
                [valueKey]="'id'"
                [labelKey]="'label'"
                [formField]="docsForm.typeId"
                [label]="'TRIAL_DOCS.FILTERS.TYPE' | translate"
                [placeholder]="'TRIAL_DOCS.FILTERS.TYPE_PLACEHOLDER' | translate"
                [options]="filteredDocumentsTypes()"
              />
            </div>
          </div>

          <div class="flex justify-end pr-6 gap-2">
            <button
              mat-stroked-button
              type="button"
              role="button"
              [disabled]="!docsForm().dirty()"
              (click)="resetForm()"
            >
              {{ 'TRIAL_DOCS.FILTERS.CLEAN_FILTERS' | translate }}
            </button>
          </div>

          <!-- Tabla -->
          <div class="overflow-x-auto">
            <table mat-table class="w-full" [dataSource]="documents()">
              <!-- Columna File name -->
              <ng-container matColumnDef="fileName">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ 'TRIAL_DOCS.TABLE.FILENAME' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                      @switch (getFileIcon(documento.fileType)) {
                        @case ('video') {
                          <ui-inta-icon name="video" color="var(--inta-button)" size="xl" />
                        }
                        @case ('image') {
                          <ui-inta-icon name="image" color="var(--inta-button)" size="xl" />
                        }
                        @default {
                          <ui-inta-icon name="document" color="var(--inta-button)" size="xl" />
                        }
                      }
                    </div>
                    <div
                      matTooltipPosition="above"
                      matTooltipClass="tw-tooltip"
                      class="flex flex-col"
                      [matTooltip]="documento.name"
                    >
                      <span class="text-sm  truncate font-medium text-gray-900">
                        {{ documento.name }}
                      </span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Columna Estado -->
              <ng-container matColumnDef="status">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ 'TRIAL_DOCS.TABLE.STATUS' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4">
                  <span
                    [class]="getStatusClasses(documento.status)"
                    [class.text-green-600]="documento.status === 'ACTIVE'"
                    [class.text-red-600]="documento.status === 'OBSOLETE'"
                  >
                    {{ getDocumentStatusLabel(documento.status) }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Versión -->
              <ng-container matColumnDef="version">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ 'TRIAL_DOCS.TABLE.VERSION' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4">
                  <span class="text-sm text-gray-600">
                    {{ documento.version }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Categoría -->
              <ng-container matColumnDef="category">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ 'TRIAL_DOCS.TABLE.CATEGORY' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4">
                  <span class="text-sm text-gray-600">
                    {{ getDocumentCategoryLabel(documento.category) }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Tipo -->
              <ng-container matColumnDef="type">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ 'TRIAL_DOCS.TABLE.TYPE' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4">
                  <span class="text-sm text-gray-600">
                    {{ documento.type.name }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Fecha -->
              <ng-container matColumnDef="createdAt">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ 'TRIAL_DOCS.TABLE.DATE' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4">
                  <span class="text-sm text-gray-600">
                    {{ documento.createdAt | intaDate }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ 'TRIAL_DOCS.TABLE.ACTIONS' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <button
                      mat-icon-button
                      matTooltip="{{ 'TRIAL_DOCS.TOOLTIPS.VIEW_DOC' | translate }}"
                      matTooltipPosition="above"
                      class="text-gray-600 hover:text-gray-900"
                      (click)="openDocumentViewer(documento)"
                    >
                      <ui-inta-icon name="eye" size="xxl" />
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="{{ 'TRIAL_DOCS.TOOLTIPS.DOWNLOAD_DOC' | translate }}"
                      matTooltipPosition="above"
                      class="text-gray-600 hover:text-gray-900"
                      (click)="downloadDocument(documento)"
                    >
                      <ui-inta-icon name="download" size="xxl" />
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="{{ 'TRIAL_DOCS.TOOLTIPS.DOC_DETAILS' | translate }}"
                      matTooltipPosition="above"
                      class="text-gray-600 hover:text-gray-900"
                      (click)="viewDocument.emit(documento.id)"
                    >
                      <ui-inta-icon name="file" size="xxl" />
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="{{ 'TRIAL_DOCS.TOOLTIPS.DELETE_DOC' | translate }}"
                      matTooltipPosition="above"
                      class="text-gray-600 hover:text-red-600"
                      [disabled]="deletingDocumentId() === documento.id"
                      (click)="deleteDocument(documento)"
                    >
                      @if (deletingDocumentId() === documento.id && deleteResource.isLoading()) {
                        <ui-inta-icon name="update" size="xxl" />
                      } @else {
                        <ui-inta-icon name="remove" size="xxl" />
                      }
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr *matHeaderRowDef="displayedColumns" mat-header-row class="bg-gray-50"></tr>
              <tr
                *matRowDef="let row; columns: displayedColumns"
                mat-row
                class="hover:bg-gray-50 transition-colors border-b border-gray-100"
              ></tr>
            </table>

            <!-- Mensaje cuando no hay resultados por filtros -->
            @if (viewState() === trialsDocsViewState.NO_RESULTS) {
              <div class="p-8 text-center">
                <mat-icon class="text-gray-400 text-5xl w-12 h-12 mb-4">search_off</mat-icon>
                <p class="text-gray-500 text-sm">{{ 'TRIAL_DOCS.NO_RESULTS' | translate }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDocs {
  protected readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly #translate = inject(TranslateService);
  readonly #dialog = inject(MatDialog);
  readonly #injector = inject(Injector);
  readonly #documentsService = inject(TrialDocsService);

  readonly trialId = input<FireTrial['id'] | undefined>(undefined);

  protected readonly typesResource = this.#documentsService.documentTypesResource;
  protected readonly documentsResource = this.#documentsService.documentsResource;
  protected readonly deleteResource = this.#documentsService.deleteDocumentResource;
  protected readonly downloadDocumentResource = this.#documentsService.downloadDocumentResource;

  readonly #downloadingFileName = signal<string>('download.bin');

  readonly docsStatus = injectTrialDocsStatus();
  readonly docsCategory = injectTrialDocsCategory();

  displayedColumns = DISPLAYED_COLUMNS;
  trialsDocsViewState = TrialDocsViewState;

  readonly formModel = signal<TrialDocsFilter>({
    category: '',
    status: '' as TrialDocsStatus,
    typeId: '',
  });

  readonly docsForm = form(this.formModel);

  readonly formData = computed(() => this.docsForm().value());

  readonly showOnlyActive = signal<boolean>(true);
  readonly deletingDocumentId = signal<string | null>(null);
  readonly hasLoadedOnce = signal<boolean>(false);

  readonly documents = computed<FireTrialDocument[]>(() => {
    if (this.documentsResource.error()) return [];
    const value = this.documentsResource.value();
    return value?.items || [];
  });

  readonly viewState = computed<TrialDocsViewState>(() => {
    if (this.documentsResource.isLoading()) return TrialDocsViewState.LOADING;
    const docs = this.documents();
    const hasLoaded = this.hasLoadedOnce();
    if (!hasLoaded) return TrialDocsViewState.LOADING;
    if (docs.length === 0 && this.hasActiveFilters()) return TrialDocsViewState.NO_RESULTS;
    if (docs.length === 0) return TrialDocsViewState.EMPTY;
    return TrialDocsViewState.HAS_DATA;
  });

  readonly documentTypes = computed(() => {
    if (this.typesResource.error()) return [];
    return this.typesResource.value()?.items || [];
  });

  readonly filteredDocumentsTypes = computed(() => {
    const category = this.formData().category;
    const types = this.documentTypes();
    if (!category) return types;
    return types.filter((t) => t.category === category);
  });

  constructor() {
    this.#documentsService.refreshDocumentTypes();

    effect(() => {
      const value = this.docsForm().value();
      const hasActiveFilter = (['category', 'status', 'typeId'] as Array<keyof TrialDocsFilter>).some(
        (k) => !!value[k] && value[k] !== 'ALL',
      );
      if (!!hasActiveFilter && this.showOnlyActive()) {
        this.showOnlyActive.set(false);
      }
    });

    effect(() => {
      if (this.showOnlyActive()) {
        this.docsForm().reset({ category: '', status: '' as TrialDocsStatus, typeId: '' });
        if (this.trialId()) {
          this.#documentsService.getDocuments(this.trialId() as string, { status: TrialDocsStatus.ACTIVE });
          this.hasLoadedOnce.set(true);
        }
      }
    });

    effect(() => {
      const id = this.trialId();
      if (id) {
        this.loadDocuments();
      }
    });

    effect(() => {
      const id = this.trialId();
      if (!id) return;

      const filter = this.formData();

      if (this.showOnlyActive()) {
        this.#documentsService.getDocuments(id as string, { status: TrialDocsStatus.ACTIVE });
      } else {
        this.#documentsService.getDocuments(id as string, { ...filter });
      }
    });

    effect(() => {
      const downloadStatus = this.downloadDocumentResource.status();
      const downloadValue = this.downloadDocumentResource.value();

      if (downloadStatus === 'resolved' && downloadValue instanceof Blob) {
        this.downloadBlob(downloadValue, this.#downloadingFileName());
        this.#documentsService.resetDownloadDocument();
      }
    });
  }

  openFilePickerDialog() {
    const dialogRef = this.#dialog.open(TrialDocsFilePicker, {
      width: '1024px',
      data: {
        trialId: this.trialId(),
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        setTimeout(() => {
          this.loadDocuments();
        }, 0);
      }
    });
  }

  loadDocuments(): void {
    this.#documentsService.getDocuments(this.trialId() as string, { status: this.showOnlyActive() ? 'ACTIVE' : 'ALL' });
    this.hasLoadedOnce.set(true);
  }

  onToggleShowOnlyActive(checked: boolean): void {
    const wasActive = this.showOnlyActive();
    this.showOnlyActive.set(checked);
    this.docsForm().reset({ category: '', status: '' as TrialDocsStatus, typeId: '' });
    if (checked) {
      if (this.trialId()) {
        this.#documentsService.getDocuments(this.trialId() as string, { status: TrialDocsStatus.ACTIVE });
        this.hasLoadedOnce.set(true);
      }
    } else if (wasActive && !checked) {
      if (this.trialId()) {
        this.#documentsService.getDocuments(this.trialId() as string, {});
        this.hasLoadedOnce.set(true);
      }
    }
  }

  hasActiveFilters(): boolean {
    const form = this.docsForm().value();
    return (
      (!!form.category && form.category !== 'ALL') ||
      (!!form.status && form.status !== 'ALL') ||
      (!!form.typeId && form.typeId !== 'ALL')
    );
  }

  getFileIcon(fileType: string): string {
    const icons: Record<string, string> = {
      pdf: 'description',
      image: 'image',
      video: 'play_circle',
      document: 'description',
    };
    return icons[fileType] || 'description';
  }

  viewDocument = output<string>();

  openDocumentViewer(documento: FireTrialDocument): void {
    const fileName = (documento.fileName || documento.name || '').toLowerCase();
    const isPdf = fileName.endsWith('.pdf');

    if (!isPdf) {
      this.#dialog.open(DownloadRequiredDialogComponent);
      return;
    }

    this.#dialog.open(DocViewer, {
      width: '90vw',
      maxWidth: '1200px',
      panelClass: 'inta-pdf-dialog',
      data: {
        documentId: documento.id,
        documentName: documento.fileName || documento.name || 'Documento',
      },
      injector: Injector.create({
        providers: [{ provide: DOC_VIEWER_SERVICE, useExisting: TrialDocsService }],
        parent: this.#injector,
      }),
    });
  }

  downloadDocument(documento: FireTrialDocument): void {
    this.#downloadingFileName.set(documento.fileName || documento.name || 'download.bin');
    this.#documentsService.downloadDocument(documento.id);
  }

  copyDocument(documento: FireTrialDocument): void {
    console.log('Copiar documento:', documento);
  }

  deleteDocument(documento: FireTrialDocument): void {
    const dialogRef = this.#dialog.open(ConfirmDeleteDialogComponent, {
      disableClose: true,
      hasBackdrop: true,
      autoFocus: true,
      backdropClass: 'backdrop-blur-xs',
      data: {
        title: this.#translate.instant('CONFIRM_DELETE_DIALOG.TITLE'),
        message: this.#translate.instant('CONFIRM_DELETE_DIALOG.MESSAGE', { name: documento.name }),
        confirmText: this.#translate.instant('CONFIRM_DELETE_DIALOG.CONFIRM'),
        cancelText: this.#translate.instant('CONFIRM_DELETE_DIALOG.CANCEL'),
        trialId: this.trialId(),
        documentId: documento.id,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      this.deletingDocumentId.set(null);
      if (confirmed) {
        this.loadDocuments();
      }
    });
  }

  getDocumentStatusLabel(status: string): string {
    return this.docsStatus().find((s) => s.value === status)?.label || status;
  }

  getDocumentCategoryLabel(category: string): string {
    return this.docsCategory().find((c) => c.value === category)?.label || category;
  }

  getStatusClasses(status: TrialDocsStatus): string {
    return status === TrialDocsStatus.ACTIVE
      ? 'inline-flex items-center rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700'
      : 'inline-flex items-center rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700';
  }

  downloadBlob(blob: Blob, fileName = 'download.bin') {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    const mimeType = (ext ? mimeTypes[ext] : undefined) || blob.type || 'application/octet-stream';
    const typedBlob = blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });
    const url = window.URL.createObjectURL(typedBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
  }

  resetForm() {
    this.docsForm().reset({ category: '', status: '' as TrialDocsStatus, typeId: '' });
  }
}
