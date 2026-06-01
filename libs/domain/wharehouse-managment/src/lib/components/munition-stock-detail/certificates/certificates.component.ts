import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UiDialogService } from '@intaqalab/ui';
import { IntaDatePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionsStockCertificatesStore } from '../../../+state/munitions-stock-certificates.store';
import type { MunitionDetailResponseModel } from '../../../models/munition-stock-detail.model';
import { LinkCertificatesDialogComponent } from '../link-dialog/link-certificate-dialog.component';
import { CertificatesFilePicker } from './certificates-file-picker/certificates-file-picker';

const DISPLAYED_COLUMNS = ['name', 'createdAt', 'components', 'acciones'];

@Component({
  selector: 'inta-certificates',
  imports: [
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    IntaDatePipe,
    IntaDatePipe,
  ],
  providers: [MunitionsStockCertificatesStore],
  template: `
    <h2 class="text-base font-semibold text-gray-900 my-6">
      {{ 'WHAREHOUSE_MANAGMENT.CERTIFICATES.HEADING' | translate }}
    </h2>
    <!-- <pre> {{ contextComponents() | json }}</pre> -->

    <div class="w-full">
      @if (!store.totalElements()) {
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
      } @else {
        <div class="w-full bg-white rounded-lg border border-gray-200">
          <div class="p-6 space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-medium text-gray-900">
                {{ 'WHAREHOUSE_MANAGMENT.CERTIFICATES.INTRO' | translate }}
              </h3>
              <div class="flex items-center gap-4">
                <button mat-flat-button (click)="openFilePickerDialog()">
                  <mat-icon>add</mat-icon>
                  {{ 'WHAREHOUSE_MANAGMENT.CERTIFICATES.BUTTON_ADD' | translate }}
                </button>
              </div>
            </div>
          </div>

          <!-- Tabla -->
          <div class="overflow-x-auto">
            <table mat-table class="w-full" [dataSource]="list()">
              <!-- Columna name -->
              <ng-container matColumnDef="name">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider !bg-gray-100"
                >
                  {{ 'WHAREHOUSE_MANAGMENT.CERTIFICATES.FILENAME' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4 !bg-white">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <mat-icon class="text-purple-600! w-5! h-5! text-xl!">description</mat-icon>
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

              <!-- Columna createdAt -->
              <ng-container matColumnDef="components">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider !bg-gray-100"
                >
                  {{ 'WHAREHOUSE_MANAGMENT.CERTIFICATES.DATE' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4 !bg-white">
                  <span class="text-sm text-gray-600">
                    {{ documento.componentView }}
                  </span>
                </td>
              </ng-container>

              <!-- Columna createdAt -->
              <ng-container matColumnDef="createdAt">
                <th
                  *matHeaderCellDef
                  mat-header-cell
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider !bg-gray-100"
                >
                  {{ 'WHAREHOUSE_MANAGMENT.CERTIFICATES.DATE' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4 !bg-white">
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
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider !bg-gray-100"
                >
                  {{ 'WHAREHOUSE_MANAGMENT.CERTIFICATES.ACTIONS' | translate }}
                </th>
                <td *matCellDef="let documento" mat-cell class="px-6 py-4 !bg-white">
                  <div class="flex items-center gap-2">
                    <button mat-icon-button class="text-gray-600 hover:text-gray-900">
                      <mat-icon class="w-5 h-5 text-xl">cloud_download</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      class="text-gray-600 hover:text-gray-900"
                      (click)="deleteCertificate(documento.id)"
                    >
                      <mat-icon class="w-5 h-5 text-xl">delete</mat-icon>
                    </button>
                    <button mat-icon-button class="text-gray-600 hover:text-gray-900" (click)="link(documento.id)">
                      <mat-icon class="w-5 h-5 text-xl">link</mat-icon>
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
          </div>
        </div>
      }
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificatesComponent {
  readonly store = inject(MunitionsStockCertificatesStore);

  stockDetail = input.required<MunitionDetailResponseModel>();
  contextComponents = input.required<{ id: string; name: string }[]>();
  displayedColumns = DISPLAYED_COLUMNS;
  #dialog = inject(MatDialog);

  list = computed(() => {
    const value = this.store.items() || [];
    const result = value.map((element) => {
      return {
        ...element,
        componentView: element.components.map((e) => e.name).join(', '),
      };
    });
    return result;
  });

  initialized = false;
  constructor() {
    effect(() => {
      const id = this.stockDetail().id;
      if (id && this.initialized === false) {
        this.initialized = true;
        this.store.searchById(id);
      }
    });
  }

  uiDialogs = inject(UiDialogService);
  async deleteCertificate(certId: string) {
    const ok = await this.uiDialogs.confirm({
      labelButtonConfirm: 'COMMONS.ACCEPT',
      title: 'WHAREHOUSE_MANAGMENT.CERTIFICATES.ACTION_DELETE_TITLE',
      htmlText: 'WHAREHOUSE_MANAGMENT.CERTIFICATES.ACTION_DELETE_HTML',
    });
    if (ok) {
      this.store.deleteItem(this.stockDetail().id, certId);
    }
  }

  openFilePickerDialog() {
    const associatedComponents = this.stockDetail().associatedComponents;
    const denominations = associatedComponents?.map((component) => component.denomination);

    this.#dialog.open(CertificatesFilePicker, {
      width: '1024px',
      data: {
        stockId: this.stockDetail().id,
        components: denominations,
      },
    });
  }

  link(certId: string) {
    this.#dialog.open(LinkCertificatesDialogComponent, {
      width: '1024px',
      data: {
        certId,
        stockDetail: this.stockDetail(),
      },
    });
  }
}
