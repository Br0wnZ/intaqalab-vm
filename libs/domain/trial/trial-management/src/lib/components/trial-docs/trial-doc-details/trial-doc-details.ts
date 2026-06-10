import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { AssociateDocTrialsDialog } from '../associate-doc-trials-dialog/associate-doc-trials-dialog';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog';
import { ModifyDocDialog } from '../modify-doc-dialog/modify-doc-dialog';
import { TrialDocVersions } from '../trial-doc-versions/trial-doc-versions';
import { TrialDocsFilePicker } from '../trial-docs-file-picker/trial-docs-file-picker';

@Component({
  selector: 'inta-trial-doc-details',
  imports: [
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    FormField,
    TrialDocVersions,
  ],
  template: `
    <div class="w-full">
      <h2 class="text-base font-semibold text-gray-900 mb-6">{{ 'TRIAL_DOCS.DOC_DETAILS.TITLE' | translate }}</h2>

      <mat-tab-group
        class="inta-tabs-2 mb-6"
        [(selectedIndex)]="selectedTabIndex"
        (selectedIndexChange)="onTabChange($event)"
      >
        <mat-tab label="{{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_MAT_LABEL' | translate }}">
          <div class="w-full bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <div class="flex items-center justify-between mb-6">
              <div></div>

              <button
                mat-flat-button
                class="flex items-center gap-2 cursor-pointer"
                [matMenuTriggerFor]="actionsMenu"
                (menuOpened)="opened.set(true)"
                (menuClosed)="opened.set(false)"
              >
                {{ 'TRIAL_DOCS.DOC_DETAILS.ACTIONS' | translate }}
                <mat-icon>
                  @if (opened()) {
                    expand_less
                  } @else {
                    expand_more
                  }
                </mat-icon>
              </button>

              <mat-menu #actionsMenu="matMenu">
                <button mat-menu-item (click)="onAction('edit')">
                  <span>{{ 'COMMONS.EDIT' | translate }}</span>
                </button>
                <button mat-menu-item (click)="onAction('delete')">
                  <span>{{ 'TRIAL_DOCS.DOC_DETAILS.DELETE' | translate }}</span>
                </button>
                <button mat-menu-item (click)="onAction('new_version')">
                  <span>{{ 'TRIAL_DOCS.DOC_DETAILS.NEW_VERSION' | translate }}</span>
                </button>
                <button mat-menu-item (click)="onAction('associated_trials')">
                  <span>{{ 'TRIAL_DOCS.DOC_DETAILS.ASSOCIATED_TRIALS' | translate }}</span>
                </button>
              </mat-menu>
            </div>

            <div class="space-y-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label for="document-type" class="block text-sm font-medium text-gray-900 mb-2">
                    {{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_TYPE' | translate }}
                  </label>
                  <mat-form-field appearance="outline" class="w-full">
                    <input
                      placeholder="{{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_TYPE_PLACEHOLDER' | translate }}"
                      id="document-type"
                      matInput
                      [formField]="docDetailsForm.documentCategory"
                    />
                  </mat-form-field>
                </div>

                <div>
                  <label for="document-subtype" class="block text-sm font-medium text-gray-900 mb-2">
                    {{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_SUBTYPE' | translate }}
                  </label>
                  <mat-form-field appearance="outline" class="w-full">
                    <input
                      placeholder="{{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_SUBTYPE_PLACEHOLDER' | translate }}"
                      id="document-subtype"
                      matInput
                      [formField]="docDetailsForm.documentType"
                    />
                  </mat-form-field>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label for="responsible-user" class="block text-sm font-medium text-gray-900 mb-2">
                    {{ 'TRIAL_DOCS.DOC_DETAILS.RESPONSIBLE_USER_NAME' | translate }}
                  </label>
                  <mat-form-field appearance="outline" class="w-full">
                    <input
                      placeholder="{{ 'TRIAL_DOCS.DOC_DETAILS.RESPONSIBLE_USER_PLACEHOLDER' | translate }}"
                      id="responsible-user"
                      matInput
                      [formField]="docDetailsForm.responsibleUser"
                    />
                  </mat-form-field>
                </div>

                <div>
                  <label for="document-title" class="block text-sm font-medium text-gray-900 mb-2">
                    {{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_TITLE' | translate }}
                  </label>
                  <mat-form-field appearance="outline" class="w-full">
                    <input
                      placeholder="{{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_TITLE_PLACEHOLDER' | translate }}"
                      id="document-title"
                      matInput
                      [formField]="docDetailsForm.documentTitle"
                    />
                  </mat-form-field>
                </div>
              </div>

              <!--  <div>
                <label for="observations" class="block text-sm font-medium text-gray-900 mb-2">
                  {{ 'TRIAL_DOCS.DOC_DETAILS.OBSERVATIONS' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full">
                  <textarea
                    placeholder="{{ 'TRIAL_DOCS.DOC_DETAILS.OBSERVATIONS_PLACEHOLDER' | translate }}"
                    id="observations"
                    matInput
                    rows="4"
                    class="resize-none"
                    [formField]="docDetailsForm.observations"
                  ></textarea>
                </mat-form-field>
              </div> -->

              <!--  <div>
                <label for="other-observations" class="block text-sm font-medium text-gray-900 mb-2">
                  {{ 'TRIAL_DOCS.DOC_DETAILS.OTHER_USERS_OBSERVATIONS' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full">
                  <textarea
                    placeholder="{{ 'TRIAL_DOCS.DOC_DETAILS.OTHER_USERS_OBSERVATIONS_PLACEHOLDER' | translate }}"
                    id="other-observations"
                    matInput
                    rows="4"
                    class="resize-none"
                    [formField]="docDetailsForm.otherUsersObservations"
                  ></textarea>
                </mat-form-field>
              </div> -->
            </div>

            <div class="mt-8">
              <h4 class="text-sm font-medium text-gray-900 mb-4">
                {{ 'TRIAL_DOCS.DOC_DETAILS.VINCULATED_TRIALS' | translate }}
              </h4>

              <div class="overflow-x-auto border border-gray-200 rounded-lg">
                <table mat-table class="w-full" [dataSource]="linkedTrialsResource.value()?.fireTrialIds || []">
                  <!-- Columna Número de prueba -->
                  <ng-container matColumnDef="trialNumber">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="!px-6 !py-3 !text-left !text-xs !font-medium !text-gray-500 !bg-gray-50"
                    >
                      {{ 'TRIAL_DOCS.DOC_DETAILS.TABLE_COLUMNS.TRIAL_NUMBER' | translate }}
                    </th>
                    <td *matCellDef="let trial" mat-cell class="!px-6 !py-4 !text-sm !text-gray-900">
                      {{ trial.trialNumber }}
                    </td>
                  </ng-container>

                  <!-- Columna Usuario vinculación -->
                  <ng-container matColumnDef="linkedUser">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="!px-6 !py-3 !text-left !text-xs !font-medium !text-gray-500 !bg-gray-50"
                    >
                      {{ 'TRIAL_DOCS.DOC_DETAILS.TABLE_COLUMNS.VINCULATED_USER' | translate }}
                    </th>
                    <td *matCellDef="let trial" mat-cell class="!px-6 !py-4 !text-sm !text-gray-900">
                      {{ trial.linkedUser }}
                    </td>
                  </ng-container>

                  <!-- Columna Fecha vinculación -->
                  <ng-container matColumnDef="linkDate">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="!px-6 !py-3 !text-left !text-xs !font-medium !text-gray-500 !bg-gray-50"
                    >
                      {{ 'TRIAL_DOCS.DOC_DETAILS.TABLE_COLUMNS.VINCULATED_DATE' | translate }}
                    </th>
                    <td *matCellDef="let trial" mat-cell class="!px-6 !py-4 !text-sm !text-gray-900">
                      {{ trial.linkDate }}
                    </td>
                  </ng-container>

                  <tr *matHeaderRowDef="displayedColumns" mat-header-row></tr>
                  <tr
                    *matRowDef="let row; columns: displayedColumns"
                    mat-row
                    class="hover:!bg-gray-50 !border-b !border-gray-100"
                  ></tr>
                </table>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="{{ 'TRIAL_DOCS.DOC_DETAILS.VERSIONS_MAT_LABEL' | translate }}">
          @if (documentVersionsResource.hasValue() && documentVersionsResource.value().length > 0) {
            <inta-trial-doc-versions [documentVersions]="documentVersionsResource.value()" />
          }
        </mat-tab>
        <!-- Descomentar par ver la parte de Admin -->
        <!-- <mat-tab label="{{ 'Gestión (Admin)' | translate }}">
          <inta-admin-docs-section />F
        </mat-tab> -->
      </mat-tab-group>
    </div>
  `,
  styles: `
    mat-form-field {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: white;
    }

    ::ng-deep .mat-mdc-form-field-outline {
      color: #e5e7eb !important;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline {
      color: #d1d5db !important;
    }

    ::ng-deep .mat-mdc-table {
      background: transparent;
    }

    ::ng-deep .mat-mdc-header-row {
      background-color: #f9fafb;
    }

    ::ng-deep .mat-mdc-header-cell {
      font-weight: 500;
      color: #6b7280;
      font-size: 0.75rem;
      padding: 12px 24px;
    }

    ::ng-deep .mat-mdc-cell {
      padding: 16px 24px;
      color: #111827;
      font-size: 0.875rem;
      border-bottom: 1px solid #f3f4f6;
    }

    ::ng-deep .mat-mdc-row:hover {
      background-color: #f9fafb;
      transition: background-color 0.2s ease;
    }

    ::ng-deep .mat-mdc-row:last-child .mat-mdc-cell {
      border-bottom: none;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    ::ng-deep button[mat-stroked-button] {
      font-weight: 500;
      text-transform: none;
      letter-spacing: normal;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDocDetails {
  readonly #translate = inject(TranslateService);
  readonly #docsService = inject(TrialDocsService);
  readonly #matDialog = inject(MatDialog);
  readonly #router = inject(Router);

  readonly documentId = input<string | undefined>(undefined);

  protected readonly documentDetailResource = this.#docsService.documentDetailResource;
  protected readonly documentObservationsResource = this.#docsService.documentObservationsResource;
  protected readonly documentVersionsResource = this.#docsService.documentVersionsResource;
  protected readonly linkedTrialsResource = this.#docsService.documentAssociatedTrialsResource;
  protected readonly deleteAssociatedDocumentResource = this.#docsService.deleteAssociatedDocumentResource;
  protected readonly downloadDocumentResource = this.#docsService.downloadDocumentResource;
  protected readonly uploadNewDocumentVersionResource = this.#docsService.uploadNewDocumentVersionResource;
  displayedColumns = ['trialNumber', 'linkedUser', 'linkDate'];

  selectedTabIndex = signal(0);
  opened = signal(false);

  readonly deoDetailsModel = signal({
    documentCategory: '',
    documentType: '',
    responsibleUser: '',
    documentTitle: '',
  });

  readonly docDetailsForm = form(this.deoDetailsModel, (f) => {
    disabled(f.documentCategory, () => true);
    disabled(f.documentType, () => true);
    disabled(f.responsibleUser, () => true);
    disabled(f.documentTitle, () => true);
  });

  constructor() {
    effect(() => {
      const id = this.documentId();
      if (id) {
        this.#docsService.getDocumentDetail(id);
        this.#docsService.getDocumentVersions(id);
        this.#docsService.getDocumentAssociatedTrials(id);
      } else {
        this.#docsService.resetDocumentDetail();
        this.#docsService.resetDocumentVersions();
        this.#docsService.resetDocumentAssociatedTrials();
        this.deoDetailsModel.set({
          documentCategory: '',
          documentType: '',
          responsibleUser: '',
          documentTitle: '',
        });
      }
    });

    effect(() => {
      const detail = this.documentDetailResource.value();
      const observations = this.documentObservationsResource.value();
      if (observations) {
        this.deoDetailsModel.update((current) => ({
          ...current,
          observations: observations[0]?.description || '',
        }));
      }
      if (detail) {
        this.deoDetailsModel.update((current) => ({
          ...current,
          documentCategory: detail.category,
          documentType: detail.type.label,
          responsibleUser: detail.createdBy,
          documentTitle: detail.name,
        }));
      }
    });

    effect(() => {
      const status = this.deleteAssociatedDocumentResource.status();

      if (status === 'resolved') {
        untracked(() => {
          this.#docsService.resetDeleteAssociated();
          const trialId = this.#docsService.fireTrialId();
          if (trialId) {
            this.#router.navigateByUrl(`/trial/view/${trialId}`);
          }
        });
      }
    });

    effect(() => {
      const downloadStatus = this.downloadDocumentResource.status();
      const downloadValue = this.downloadDocumentResource.value();

      if (downloadStatus === 'resolved' && downloadValue instanceof Blob) {
        this.downloadBlob(downloadValue, this.documentDetailResource.value()?.name);
        this.#docsService.resetDownloadDocument();
      }
    });
  }

  onAction(action: string): void {
    switch (action) {
      case 'edit':
        this.editDocument();
        break;
      case 'delete':
        this.deleteDocument();
        break;
      case 'new_version':
        this.openFilePickerDialog();
        break;
      case 'associated_trials':
        this.openAssociatedTrialsDialog();
        break;
      default:
        break;
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  openFilePickerDialog() {
    const dialogRef = this.#matDialog.open(TrialDocsFilePicker, {
      width: '1024px',
      data: {
        documentId: this.documentDetailResource.value()?.id,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'add') {
        const docId = this.documentId();
        if (docId) {
          this.#docsService.getDocumentDetail(docId);
          this.#docsService.getDocumentVersions(docId);
        }
      }
    });
  }

  openAssociatedTrialsDialog() {
    const dialogRef = this.#matDialog.open(AssociateDocTrialsDialog, {
      width: '1024px',
      data: {
        documentId: this.documentDetailResource.value()?.id,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const documentId = this.documentDetailResource.value()?.id;
        if (documentId) {
          this.#docsService.getDocumentDetail(documentId);
        }
      }
    });
  }

  editDocument() {
    const dialogRef = this.#matDialog.open(ModifyDocDialog, {
      width: '600px',
      data: {
        document: this.documentDetailResource.value(),
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const documentId = this.documentDetailResource.value()?.id;
        if (documentId) {
          this.#docsService.getDocumentDetail(documentId);
        }
      }
    });
  }

  deleteDocument(): void {
    const document = this.documentDetailResource.value();
    if (!document) return;
    const dialogRef = this.#matDialog.open(ConfirmDeleteDialogComponent, {
      disableClose: true,
      autoFocus: true,
      data: {
        title: this.#translate.instant('TRIAL_DOCS.DELETE_DOCUMENT_DIALOG.TITLE'),
        description: this.#translate.instant('TRIAL_DOCS.DELETE_DOCUMENT_DIALOG.DESCRIPTION', {
          fileName: document.name,
        }),
        message: this.#translate.instant('TRIAL_DOCS.DELETE_DOCUMENT_DIALOG.MESSAGE'),
        confirmText: this.#translate.instant('TRIAL_DOCS.DELETE_DOCUMENT_DIALOG.CONFIRM'),
        cancelText: this.#translate.instant('TRIAL_DOCS.DELETE_DOCUMENT_DIALOG.BACK'),
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.#docsService.deleteAssociatedDocument(document.id);
      }
    });
  }

  downloadDocument(): void {
    const document = this.documentDetailResource.value();
    if (!document) return;
    this.#docsService.downloadDocument(document.id);
  }

  downloadBlob(blob: Blob, fileName = 'download.bin') {
    const mimeType = this.#resolveMimeType(fileName) || blob.type || 'application/octet-stream';
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

  #resolveMimeType(fileName: string): string {
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
    return ext ? (mimeTypes[ext] ?? '') : '';
  }
}
