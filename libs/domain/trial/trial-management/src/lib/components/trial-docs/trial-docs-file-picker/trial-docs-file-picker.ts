import type { ElementRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { ALLOWED_EXTENSIONS } from '../../../utils-models/valid-extensions';

@Component({
  selector: 'inta-trial-docs-file-picker',
  imports: [
    TranslateModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    IntaSignalSelectComponent,
    FormField,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="upload" size="xxl" />
      <span>{{ 'TRIAL_DOC_PICKER_DIALOG.TITLE' | translate }}</span>
    </h2>

    <mat-dialog-content>
      <div class="flex flex-col gap-4">
        @if (!isUploadingVersion()) {
          <ui-inta-signal-select
            appearance="outline"
            [id]="'document-type-select'"
            [valueKey]="'id'"
            [labelKey]="'label'"
            [formField]="uploadFileForm.documentType"
            [label]="'TRIALS_LIST.FILTERS.DOCUMENT_TYPE' | translate"
            [placeholder]="'TRIALS_LIST.FILTERS.DOCUMENT_TYPE_PLACEHOLDER' | translate"
            [options]="documentTypes()"
          />
        }

        <div>
          <label for="fileInput" class="block text-sm font-medium text-gray-900 mb-2">
            {{ 'TRIAL_DOC_PICKER_DIALOG.DOCUMENT_LABEL' | translate }}
          </label>
          @if (!formModel().file) {
            <div
              class="relative border-2 border-dashed border-gray-300 rounded-lg p-12 flex items-center justify-center bg-white hover:border-gray-400 transition-colors"
              [class.border-gray-300]="!isDragging()"
              [class.hover:border-gray-400]="!isDragging()"
              [class.border-purple-500]="isDragging()"
              [class.bg-purple-50]="isDragging()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
            >
              <input
                id="fileInput"
                type="file"
                class="hidden"
                [accept]="validExtensions().join(',')"
                [disabled]="isUploading()"
                (change)="onFileSelected($event)"
                #fileInput
              />

              <div class="text-center">
                <div class="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    class="flex items-center gap-2 bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] cursor-pointer text-white px-6 py-2.5 rounded-lg font-medium"
                    [disabled]="isUploading()"
                    (click)="triggerFileInput()"
                  >
                    {{ 'TRIAL_DOC_PICKER_DIALOG.SELECT_DOC' | translate }}
                  </button>
                  <p class="text-sm text-gray-500">{{ 'TRIAL_DOC_PICKER_DIALOG.DRAG_HERE' | translate }}</p>
                </div>
              </div>
            </div>
          }
          @if (formModel().file) {
            <div
              class="inta-bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div class="p-4 flex items-center gap-4">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  @if (isUploading()) {
                    <mat-icon class="text-purple-600 text-2xl animate-pulse">upload_file</mat-icon>
                  } @else {
                    @switch (getFileIcon()) {
                      @case ('video') {
                        <ui-inta-icon name="video" color="var(--inta-button)" size="xl" />
                      }
                      @case ('image') {
                        <ui-inta-icon name="image" color="var(--inta-button)" size="xl" />
                      }
                      @case ('description') {
                        <ui-inta-icon name="document" color="var(--inta-button)" size="xl" />
                      }
                      @default {
                        <mat-icon class="text-violet-600 text-2xl">{{ getFileIcon() }}</mat-icon>
                      }
                    }
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ getFileName() }}
                  </p>
                  <div class="flex items-center gap-2">
                    <p class="text-xs text-gray-500">
                      {{ getFileSize() }}
                    </p>
                    @if (isUploading()) {
                      <span class="text-xs text-purple-600 font-medium">
                        • {{ 'TRIAL_DOC_PICKER_DIALOG.UPLOADING' | translate }} {{ uploadProgress() }}%
                      </span>
                    }
                  </div>
                </div>

                <button
                  type="button"
                  mat-icon-button
                  class="text-gray-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                  [disabled]="isUploading()"
                  (click)="removeFile()"
                >
                  <ui-inta-icon name="remove" size="xl" />
                </button>
              </div>

              @if (!isUploading()) {
                <mat-progress-bar mode="determinate" class="h-1" [value]="uploadProgress()"></mat-progress-bar>
              }
            </div>
          }
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-flat-button [disabled]="!uploadFileForm().valid || isUploading()" (click)="onAdd()">
        @if (isUploading()) {
          <ng-container>
            <mat-icon class="mr-2 animate-spin">refresh</mat-icon>
            {{ 'TRIAL_DOC_PICKER_DIALOG.UPLOADING' | translate }}
          </ng-container>
        } @else {
          {{ 'TRIAL_DOC_PICKER_DIALOG.ADD' | translate }}
        }
      </button>
      <button mat-stroked-button [disabled]="isUploading()" (click)="onCancel()">
        {{ 'TRIAL_DOC_PICKER_DIALOG.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDocsFilePicker {
  protected readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly #translate = inject(TranslateService);
  readonly #documentsService = inject(TrialDocsService);
  readonly #data = inject(MAT_DIALOG_DATA);
  public readonly dialogRef = inject(MatDialogRef<TrialDocsFilePicker>);

  protected readonly uploadResource = this.#documentsService.uploadDocumentResource;
  protected readonly uploadNewVersionResource = this.#documentsService.uploadNewDocumentVersionResource;
  protected readonly typesResource = this.#documentsService.documentTypesResource;

  readonly validExtensions = signal(ALLOWED_EXTENSIONS);
  readonly isDragging = signal(false);

  readonly isUploadingVersion = computed(() => {
    const data = this.#data;
    return data.documentId !== undefined;
  });

  readonly title = computed(() => {
    return this.isUploadingVersion()
      ? this.#translate.instant('TRIAL_DOCS.NEW_DOCUMENT_VERSION_DIALOG.TITLE')
      : this.#translate.instant('TRIAL_DOC_PICKER_DIALOG.TITLE');
  });

  readonly uploadProgress = computed(() => {
    const progress = this.uploadResource.progress();
    if (!progress) return 0;

    return progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
  });

  readonly isUploading = computed(() => {
    return this.uploadResource.isLoading();
  });

  readonly documentTypes = computed(() => {
    return this.typesResource.value()?.items || [];
  });

  readonly formModel = signal<{
    documentType: string;
    file: File | null;
  }>({
    documentType: '',
    file: null,
  });

  readonly uploadFileForm = form(this.formModel, (f) => {
    required(f.documentType, { when: () => !this.isUploadingVersion() });
    disabled(f.documentType, () => this.isUploading());
    disabled(f.file, () => this.isUploading());
  });

  constructor() {
    this.#documentsService.loadDocumentTypes();
    this.#documentsService.resetUpload();
    this.#documentsService.resetNewDocumentVersion();

    effect(() => {
      const result = this.uploadResource.status();

      if (result === 'resolved') {
        this.dialogRef.close({
          action: 'add',
          data: { documentId: this.#data.documentId },
        });
      }
    });

    effect(() => {
      const result = this.uploadNewVersionResource.status();

      if (result === 'resolved') {
        this.dialogRef.close({
          action: 'add',
          data: { documentId: this.#data.documentId },
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.#setFile(input.files[0]);
    }
  }

  #setFile(file: File): void {
    this.formModel.update((model) => ({ ...model, file }));
    this.uploadFileForm.file().markAsTouched();
  }

  triggerFileInput(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  onAdd(): void {
    if (this.uploadFileForm().valid() && !this.isUploading()) {
      this.uploadSelectedFile();
    } else {
      this.uploadFileForm().markAsTouched();
    }
  }

  removeFile(): void {
    if (this.isUploading()) return;

    this.formModel.update((model) => ({ ...model, file: null }));

    const fileInput = this.fileInputRef()?.nativeElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    if (this.isUploading()) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.isUploading()) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  handleFiles(files: File[]): void {
    const validFiles = files.filter((file) => this.#isValidFile(file));
    if (validFiles.length > 0) {
      this.#setFile(validFiles[0]);
    }
  }

  uploadSelectedFile(): void {
    const trialId = this.#data.trialId;
    const file = this.formModel().file as File;
    const name = file.name;
    const documentType = this.uploadFileForm.documentType().value();
    const category = this.documentTypes().find((type) => type.id === documentType)?.category || 'GENERAL';
    if (this.isUploadingVersion() && file) {
      const documentId = this.#data.documentId;
      this.#documentsService.uploadNewDocumentVersion(documentId, file);
    }

    if (!trialId || !file || !documentType) return;

    this.#documentsService.uploadDocument(trialId, file, documentType, category, name);
  }

  onCancel(): void {
    if (this.isUploading()) {
      return;
    }
    this.dialogRef.close();
  }

  #isValidFile(file: File): boolean {
    const validExtensions = this.validExtensions();
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    return validExtensions.includes(fileExtension);
  }

  getFileName(): string {
    return this.formModel().file?.name || '';
  }

  getFileIcon = (): string =>
    [
      { exts: ['.pdf'], icon: 'picture_as_pdf' },
      { exts: ['.doc', '.docx'], icon: 'description' },
      { exts: ['.xls', '.xlsx'], icon: 'table_chart' },
      { exts: ['.jpg', '.jpeg', '.png'], icon: 'image' },
    ].find(({ exts }) => exts.some((ext) => this.getFileName().toLowerCase().endsWith(ext)))?.icon ||
    'insert_drive_file';

  getFileSize = (): string => {
    const file = this.formModel().file as File;
    const bytes = file ? file.size : 0;
    return bytes === 0
      ? '0 Bytes'
      : (() => {
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
        })();
  };

  // Only for testing purposes
  public getTypesResource() {
    return this.typesResource;
  }

  public getuploadResource() {
    return this.uploadResource;
  }
}
