import { TitleCasePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectWharehouseEndpoint } from '@intaqalab/config';
import { NoLeadingZerosDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type {
  MasterDataI18nItem,
  WarehouseDenominationItem,
  WarehousePaginatedResponse,
} from '../../../utils-models/catalog.model';
import type { ComponentDetail, ReconditioningData } from '../../../utils-models/munitions.model';
import { hasReconditioning } from '../../../utils-models/munitions.model';
import { ConditioningFieldsComponent } from '../conditioning-fields/conditioning-fields.component';
import { CargaDetailFormComponent } from './carga-detail-form/carga-detail-form.component';
import { EspoletaDetailFormComponent } from './espoleta-detail-form/espoleta-detail-form.component';
import { SuplementoDetailFormComponent } from './suplemento-detail-form/suplemento-detail-form.component';

@Component({
  selector: 'inta-component-detail-form',
  imports: [
    TitleCasePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FormField,
    ConditioningFieldsComponent,
    NoLeadingZerosDirective,
    TranslateModule,
    EspoletaDetailFormComponent,
    SuplementoDetailFormComponent,
    CargaDetailFormComponent,
  ],
  template: `
    <div class="p-4 sm:p-6 bg-gray-100">
      <div class="flex justify-end mb-4">
        <button mat-flat-button color="primary" (click)="onAddPowder()">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.ADD_POWDER_BUTTON' | translate }}
        </button>
      </div>

      @switch (detail().type.type.toLowerCase()) {
        @case ('espoleta') {
          <inta-espoleta-detail-form [detail]="detail()" (detailChange)="onDetailChange($event)" />
        }
        @case ('suplemento') {
          <inta-suplemento-detail-form [detail]="detail()" (detailChange)="onDetailChange($event)" />
        }
        @case ('carga de proyección') {
          <inta-carga-detail-form [detail]="detail()" (detailChange)="onDetailChange($event)" />
        }
        @default {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div class="w-full">
              <label
                for="component-type"
                class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
              >
                {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.TYPE' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input id="component-type" matInput readonly [value]="componentTypeLabel() | titlecase" />
              </mat-form-field>
            </div>

            <div class="w-full">
              <label
                for="component-denomination"
                class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
              >
                {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.DENOMINATION' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select
                  id="component-denomination"
                  [value]="denominationId()"
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MODEL' | translate"
                  (selectionChange)="onDenominationChange($event.value)"
                >
                  @for (denom of denominations(); track denom.id) {
                    <mat-option [value]="denom.id">{{ denom.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="w-full">
              <label
                for="component-batch"
                class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
              >
                {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.LOT' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  id="component-batch"
                  matInput
                  [formField]="detailForm.batch"
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT' | translate"
                  (blur)="emitChanges()"
                />
              </mat-form-field>
            </div>

            <div class="w-full">
              <label
                for="component-errors"
                class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
              >
                {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.MAX_FAILURES' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  id="component-errors"
                  matInput
                  type="number"
                  libNoLeadingZeros
                  [formField]="detailForm.maxAllowedErrors"
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FAILURES' | translate"
                  (blur)="emitChanges()"
                />
              </mat-form-field>
            </div>

            <div class="w-full">
              <label
                for="component-client"
                class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
              >
                {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.CLIENT_NUMBER' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  id="component-client"
                  matInput
                  type="number"
                  [formField]="detailForm.clientNumber"
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.CLIENT' | translate"
                  (blur)="emitChanges()"
                />
              </mat-form-field>
            </div>
          </div>

          <div class="mt-4">
            <label for="component-observations" class="block text-xs font-medium text-gray-600 mb-2">
              {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.OBSERVATIONS_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <textarea
                placeholder="{{
                  'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.OBSERVATIONS_PLACEHOLDER' | translate
                }}"
                id="component-observations"
                matInput
                rows="2"
                [formField]="detailForm.observations"
                (blur)="emitChanges()"
              ></textarea>
            </mat-form-field>
          </div>
        }
      }

      <div class="flex justify-end mt-4">
        <mat-checkbox
          class="!text-gray-700"
          [checked]="isConditioningEnabled()"
          (change)="onConditioningToggle($event.checked)"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.CONDITIONING_CHECKBOX' | translate }}
        </mat-checkbox>
      </div>

      @if (isConditioningEnabled()) {
        <div class="mt-4">
          <inta-conditioning-fields [data]="conditioningData()" (dataChange)="onConditioningChange($event)" />
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentDetailFormComponent {
  readonly #warehouseUrl = injectWharehouseEndpoint();

  readonly detail = input.required<ComponentDetail>();
  readonly detailChange = output<ComponentDetail>();
  readonly addPowder = output<void>();

  readonly #denominationsResource = httpResource<WarehousePaginatedResponse<WarehouseDenominationItem>>(() => {
    const typeId = this.detail().type.id;
    if (!typeId) return undefined;

    return {
      url: `${this.#warehouseUrl}/denominations`,
      params: { pageSize: 100, active: true, munitionTypeId: typeId },
      method: 'GET',
    };
  });

  readonly denominations = computed<MasterDataI18nItem[]>(() => {
    const response = this.#denominationsResource.value();
    return (
      response?.items.map(
        (item: WarehouseDenominationItem): MasterDataI18nItem => ({
          id: item.id,
          name: { es: item.name, en: item.name },
          label: item.name,
          active: item.active,
        }),
      ) ?? []
    );
  });

  readonly formModel = linkedSignal(() => this.detail());

  readonly componentTypeLabel = computed(() => this.detail().type.label || this.detail().type.type);

  readonly isConditioningEnabled = computed(() => hasReconditioning(this.formModel().reconditioning));

  readonly denominationId = computed(() => this.formModel().denomination?.id ?? '');

  readonly conditioningData = computed<ReconditioningData>(() => {
    return this.formModel().reconditioning ?? {};
  });

  readonly detailForm = form(this.formModel, (f) => {
    required(f.denomination);
  });

  emitChanges(): void {
    const value = this.detailForm().value();
    this.detailChange.emit(value as ComponentDetail);
  }

  onDetailChange(updatedDetail: ComponentDetail): void {
    this.formModel.set(updatedDetail);
    this.detailChange.emit(updatedDetail);
  }

  onDenominationChange(denominationId: string): void {
    const denom = this.denominations().find((d) => d.id === denominationId);
    if (denom) {
      this.formModel.update((current) => ({
        ...current,
        denomination: { id: denom.id, name: denom.label },
      }));
      this.emitChanges();
    }
  }

  onAddPowder(): void {
    this.addPowder.emit();
  }

  onConditioningToggle(enabled: boolean): void {
    this.formModel.update((current) => ({
      ...current,
      reconditioning: enabled ? { temperature: 21, tolerance: 2, timeMin: 4, timeMax: 24 } : undefined,
    }));
    this.emitChanges();
  }

  onConditioningChange(data: ReconditioningData): void {
    this.formModel.update((current) => ({
      ...current,
      reconditioning: data,
    }));
    this.emitChanges();
  }
}
