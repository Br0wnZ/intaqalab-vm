import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { IntaDatePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionsStockDetailStore } from '../../../+state/munition-stock-detail.store';
import type { StockEntity } from '../../../models/munition-stock-detail.model';
import { TransferDialogComponent } from '../../shared/transfer-dialog/transfer-dialog.component';
import { CertificatesComponent } from '../certificates/certificates.component';
import { ComponentsTableComponent } from '../components-table/components-table.component';
import { RetireDialogComponent } from '../retire-dialog/retire-dialog.component';

@Component({
  imports: [
    TranslateModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    IntaDatePipe,
    ComponentsTableComponent,
    CertificatesComponent,
  ],

  template: `
    <div>
      <h2 class="text-base font-semibold text-gray-900 my-6">
        {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.HEADING' | translate }}
      </h2>

      <div class="w-full flex justify-end mb-6">
        <button
          mat-flat-button
          [matMenuTriggerFor]="menu"
          (menuOpened)="opened.set(true)"
          (menuClosed)="opened.set(false)"
        >
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.ACTIONS' | translate }}
          <mat-icon>
            {{ opened() ? 'expand_less' : 'expand_more' }}
          </mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="retire()">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.ACTION_RETIRE' | translate }}
          </button>
          <button mat-menu-item (click)="transfer()">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.ACTION_TRANSFER' | translate }}
          </button>
          <button mat-menu-item (click)="movements()">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.ACTION_MOVEMENTS' | translate }}
          </button>
        </mat-menu>
      </div>

      <!-- formulario -->
      @let formData = store.item();
      @if (formData) {
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div class="w-full">
            <label for="client" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="client" matInput disabled="true" [value]="formData.generalData.client.name" />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CATEGORY' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                id="WHAREHOUSE_MANAGMENT"
                matInput
                disabled="true"
                [value]="'WHAREHOUSE_MANAGMENT.' + categoryView() | translate"
              />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.TYPE' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="type" matInput disabled="true" [value]="formData.munitionType.name" />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="denomination" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.DENOMINATION_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="denomination" matInput disabled="true" [value]="formData.denomination.name" />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="batch" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="batch" matInput disabled="true" [value]="formData.batch" />
            </mat-form-field>
          </div>
          @if (formData.quantity !== undefined) {
            <div class="w-full">
              <label for="quantity" class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <input id="quantity" matInput disabled="true" [value]="formData.quantity" />
              </mat-form-field>
            </div>
          }
          <div class="w-full">
            <label for="totalNeq" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.TOTAL_NEQ' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="totalNeq" matInput disabled="true" [value]="formData.totalNeq ?? ''" />
            </mat-form-field>
          </div>
          @if (formData.weight !== undefined) {
            <div class="w-full">
              <label for="weight" class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.NOMINAL_WEIGHT' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <input id="weight" matInput disabled="true" [value]="formData.weight" />
              </mat-form-field>
            </div>
          }
          <div class="w-full">
            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.STATUS' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                id="status"
                matInput
                disabled="true"
                [value]="'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.STATUS_' + formData.status | translate"
              />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="entryDate" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ENTRY_DATE_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="entryDate" matInput disabled="true" [value]="formData.generalData.entryDate | intaDate" />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="munitionDumpId" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.MUNITIONS_DUMP' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                id="munitionDumpId"
                matInput
                disabled="true"
                [value]="formData.location.munitionDump.munitionDumpId"
              />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="cellName" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.CELL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="cellName" matInput disabled="true" [value]="formData.location.cellName" />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="trialname" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.PLANNED_TRIAL_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="trialname" matInput disabled="true" [value]="formData.generalData?.plannedFireTrial?.name" />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="scheduledDate" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.DAY_UTILIZATION' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                id="scheduledDate"
                matInput
                disabled="true"
                [value]="formData.generalData.plannedFireTrial?.scheduledDate | intaDate"
              />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="retirementDate" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.RETIREMENT_DATE' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="retirementDate" matInput disabled="true" [value]="formData.retirementDate | intaDate" />
            </mat-form-field>
          </div>
          <div class="w-full">
            <label for="retirementReason" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.RETIREMENT_REASON' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="retirementReason" matInput disabled="true" [value]="formData.retirementReason" />
            </mat-form-field>
          </div>
        </div>
        <!-- fin formulario -->
        @if (categoryView() === 'MUNITION') {
          <inta-components-table [munition]="formData"></inta-components-table>
        }
        <inta-certificates [id]="id()" [stockDetail]="formData" [contextComponents]="componentesCertificates()" />
      }
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionStockDetailShellComponent {
  readonly store = inject(MunitionsStockDetailStore);

  id = input.required<string>();
  entity = input.required<string>();

  categoryView = computed(() => {
    const result = this.entity() === 'munitions' ? 'MUNITION' : 'MUNITION_COMPONENT';
    return result;
  });

  opened = signal(false);
  constructor() {
    effect(() => {
      const id = this.id();
      const entityParam: StockEntity = this.entity() === 'munitions' ? 'munitions' : 'munition-components';
      if (id !== undefined && entityParam !== undefined) {
        this.store.searchById(id, entityParam);
      }
    });
  }

  componentesCertificates = computed(() => {
    const data = this.store.item();
    if (data !== undefined) {
      if (this.categoryView() === 'MUNITION_COMPONENT') {
        return [{ id: data.id, name: `${data.denomination.name} - ${data.batch}` }];
      } else {
        return data.associatedComponents.map((e) => ({ id: e.id, name: `${e.denomination.name} - ${data.batch}` }));
      }
    }
    return [];
  });

  #dialog = inject(MatDialog);
  retire() {
    const item = this.store.item();
    if (item) {
      this.#dialog.open(RetireDialogComponent, {
        data: { item, category: this.categoryView() },
        width: '1024px',
      });
    }
  }

  transfer() {
    const item = this.store.item();
    if (item) {
      this.#dialog.open(TransferDialogComponent, {
        data: { item, category: this.categoryView() },
        width: '1024px',
      });
    }
  }

  #router = inject(Router);
  movements() {
    this.#router.navigateByUrl(`/wharehouse-managment/movements`);
  }
}
