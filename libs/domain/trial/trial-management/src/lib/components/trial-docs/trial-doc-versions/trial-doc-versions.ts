import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { IntaDatePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { DocumentVersion } from '../../../utils-models/documents-service.model';
import { ChangeDocVersionDialog } from '../change-doc-version-dialog/change-doc-version-dialog';

@Component({
  selector: 'inta-trial-doc-versions',
  imports: [TranslateModule, MatRadioModule, MatTableModule, MatTabsModule, IntaDatePipe],
  template: `
    <div class="w-full bg-white rounded-lg border border-gray-200 mt-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-base font-medium text-gray-900">{{ 'TRIAL_DOCS.VERSIONS.TITLE' | translate }}</h3>
      </div>

      <div class="overflow-x-auto">
        <table mat-table class="w-full" [dataSource]="documentVersions()">
          <ng-container matColumnDef="select">
            <th *matHeaderCellDef mat-header-cell class="w-5"></th>
            <td *matCellDef="let version" mat-cell class="w-5">
              <mat-radio-button
                color="primary"
                class="custom-radio"
                [value]="version.id"
                [checked]="activeVersion() === version.id"
                (change)="onVersionSelect(version)"
              ></mat-radio-button>
            </td>
          </ng-container>

          <ng-container matColumnDef="versionNumber">
            <th
              *matHeaderCellDef
              mat-header-cell
              class="!px-6 !py-3 !text-left !text-xs !font-medium !text-gray-500 !bg-gray-50"
            >
              {{ 'TRIAL_DOCS.VERSIONS.TABLE_COLUMNS.VERSION_NUMBER' | translate }}
            </th>
            <td *matCellDef="let version" mat-cell class="!px-6 !py-4 !text-sm !text-gray-900 font-bold">
              {{ version.versionTag }}
            </td>
          </ng-container>

          <ng-container matColumnDef="uploadDate">
            <th
              *matHeaderCellDef
              mat-header-cell
              class="!px-6 !py-3 !text-left !text-xs !font-medium !text-gray-500 !bg-gray-50"
            >
              {{ 'TRIAL_DOCS.VERSIONS.TABLE_COLUMNS.UPLOAD_DATE' | translate }}
            </th>
            <td *matCellDef="let version" mat-cell class="!px-6 !py-4 !text-sm !text-gray-900">
              {{ version.createdAt | intaDate }}
            </td>
          </ng-container>

          <ng-container matColumnDef="uploadedBy">
            <th
              *matHeaderCellDef
              mat-header-cell
              class="!px-6 !py-3 !text-left !text-xs !font-medium !text-gray-500 !bg-gray-50"
            >
              {{ 'TRIAL_DOCS.VERSIONS.TABLE_COLUMNS.UPLOADED_BY' | translate }}
            </th>
            <td *matCellDef="let version" mat-cell class="!px-6 !py-4 !text-sm !text-gray-900">
              {{ version.createdBy }}
            </td>
          </ng-container>

          <tr *matHeaderRowDef="displayedColumns" mat-header-row></tr>
          <tr
            *matRowDef="let row; columns: displayedColumns"
            mat-row
            class="hover:!bg-gray-50 !transition-colors !border-b !border-gray-100"
            [class.!bg-blue-50]="activeVersion() === row.id"
          ></tr>
        </table>
      </div>
    </div>
  `,
  styles: `
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

    ::ng-deep .mat-mdc-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    ::ng-deep .mat-mdc-row:hover {
      background-color: #f9fafb;
    }

    ::ng-deep .mat-mdc-row:last-child .mat-mdc-cell {
      border-bottom: none;
    }

    ::ng-deep .custom-radio .mdc-radio__outer-circle {
      border-color: #7c3aed;
    }

    ::ng-deep .custom-radio .mdc-radio__inner-circle {
      border-color: #7c3aed;
    }

    ::ng-deep .custom-radio.mat-mdc-radio-checked .mdc-radio__outer-circle {
      border-color: #7c3aed;
    }

    ::ng-deep .custom-radio.mat-mdc-radio-checked .mdc-radio__inner-circle {
      border-color: #7c3aed;
      background-color: #7c3aed;
    }

    ::ng-deep .mat-mdc-row.selected-row {
      background-color: #eff6ff !important;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDocVersions {
  readonly #dialog = inject(MatDialog);
  readonly documentVersions = input.required<DocumentVersion[]>();
  readonly documentId = input.required<string>();
  displayedColumns = ['select', 'versionNumber', 'uploadDate', 'uploadedBy'];

  readonly selectedVersionId = signal<string | undefined>(undefined);

  readonly activeVersion = computed(() => {
    const selectedId = this.selectedVersionId();
    if (selectedId) {
      return selectedId;
    }
    const activeVersion = this.documentVersions().find((version) => version.isActive);
    return activeVersion ? activeVersion.id : '';
  });

  onVersionSelect(version: DocumentVersion): void {
    if (version.isActive) return;

    this.selectedVersionId.set(version.id);
    const dialogRef = this.#dialog.open(ChangeDocVersionDialog, {
      width: '30rem',
      data: {
        documentId: this.documentId(),
        version,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        const activeVersion = this.documentVersions().find((v) => v.isActive);
        this.selectedVersionId.set(activeVersion ? activeVersion.id : undefined);
      }
    });
  }
}
