import { TitleCasePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectWharehouseEndpoint } from '@intaqalab/config';
import { NoLeadingZerosDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
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
    NoNegativeValuesDirective,
  ],
  template: `
    <div class="p-4 sm:p-6 bg-gray-100">
      @if (isPowderType()) {
        <div class="flex justify-end mb-4">
          <button mat-flat-button color="primary" (click)="onAddPowder()">
            {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.ADD_POWDER_BUTTON' | translate }}
          </button>
        </div>
      }

      @switch (detail().type.type.toLowerCase()) {
        @case ('espoleta') {
          <inta-espoleta-detail-form
            [detail]="detail()"
            [assignedShotsCount]="assignedShotsCount()"
            (detailChange)="onDetailChange($event)"
          />
        }
        @case ('suplemento') {
          <inta-suplemento-detail-form
            [detail]="detail()"
            [assignedShotsCount]="assignedShotsCount()"
            (detailChange)="onDetailChange($event)"
          />
        }
        @case ('carga de proyección') {
          <inta-carga-detail-form
            [detail]="detail()"
            [assignedShotsCount]="assignedShotsCount()"
            (detailChange)="onDetailChange($event)"
          />
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
                  (openedChange)="onDenominationPanelToggle($event)"
                >
                  <div class="px-3 py-2">
                    <input
                      matInput
                      type="text"
                      [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.SEARCH_PLACEHOLDER' | translate"
                      [value]="denominationSearchTerm()"
                      (input)="onDenominationSearchInput($event)"
                      (keydown)="$event.stopPropagation()"
                      (click)="$event.stopPropagation()"
                      (mousedown)="$event.stopPropagation()"
                      #denominationSearchInput
                    />
                  </div>
                  @for (denom of filteredDenominations(); track denom.id) {
                    <mat-option [value]="denom.id">{{ denom.label }}</mat-option>
                  }
                  @if (filteredDenominations().length === 0) {
                    <mat-option disabled>
                      {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.NO_RESULTS' | translate }}
                    </mat-option>
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
                  libNoNegativeValues
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
                  type="text"
                  [formField]="detailForm.clientNumber"
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.CLIENT' | translate"
                  (input)="onClientNumberInput($event)"
                  (blur)="emitChanges()"
                />
                @if (detailForm.clientNumber().touched() && detailForm.clientNumber().errors()) {
                  @for (error of detailForm.clientNumber().errors(); track error) {
                    <mat-error class="!text-xs mt-2">{{ error.message }}</mat-error>
                  }
                }
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
          <inta-conditioning-fields
            [data]="conditioningData()"
            [showErrors]="!conditioningValid()"
            (dataChange)="onConditioningChange($event)"
          />
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
  readonly denominationSearchInputRef = viewChild<ElementRef<HTMLInputElement>>('denominationSearchInput');
  readonly #warehouseUrl = injectWharehouseEndpoint();

  readonly detail = input.required<ComponentDetail>();
  readonly assignedShotsCount = input<number>(0);
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

  readonly isPowderType = computed(() => {
    const type = this.detail()
      .type.type.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return type === 'polvora' || type.startsWith('polvora');
  });

  readonly isConditioningEnabled = computed(() => hasReconditioning(this.formModel().reconditioning));

  readonly denominationId = computed(() => this.formModel().denomination?.id ?? '');
  readonly denominationSearchTerm = signal('');

  readonly filteredDenominations = computed(() => {
    const term = this.#normalizeText(this.denominationSearchTerm());
    const items = this.denominations();

    if (!term) return items;

    return items.filter((denom) => {
      const label = this.#normalizeText(denom.label);
      const esName = this.#normalizeText(denom.name?.['es'] ?? '');
      const enName = this.#normalizeText(denom.name?.['en'] ?? '');
      return label.includes(term) || esName.includes(term) || enName.includes(term);
    });
  });

  readonly conditioningData = computed<ReconditioningData>(() => {
    return this.formModel().reconditioning ?? {};
  });

  /**
   * True when conditioning is disabled OR all 4 required numeric fields are filled.
   * This computed is separate from `detailForm` to avoid breaking existing form validations.
   */
  readonly conditioningValid = computed(() => {
    if (!this.isConditioningEnabled()) return true;
    const r = this.formModel().reconditioning;
    if (!r) return false;
    const isValidNum = (v: number | undefined | null): boolean => v !== undefined && v !== null && !isNaN(v);
    return isValidNum(r.temperature) && isValidNum(r.tolerance) && isValidNum(r.timeMin) && isValidNum(r.timeMax);
  });

  readonly detailForm = form(this.formModel, (f) => {
    required(f.denomination);
    validate(f.clientNumber, ({ value }) => {
      const val = String(value() ?? '').trim();
      if (!val || val === '0') return null;

      if (val.endsWith(',')) {
        return { kind: 'trailing-comma', message: 'No puede terminar con coma' };
      }

      const numbersCount = val.split(',').filter((x) => x.trim().length > 0).length;
      const limit = this.assignedShotsCount();

      if (numbersCount > limit) {
        return {
          kind: 'max-numbers',
          message: `No puede haber más números (${numbersCount}) que disparos asociados (${limit})`,
        };
      }

      return null;
    });
  });

  /** Combined validity: Signal Form fields + conditioning required fields */
  readonly isValid = computed(() => this.detailForm().valid() && this.conditioningValid());

  emitChanges(): void {
    const value = this.detailForm().value();
    this.detailChange.emit(value as ComponentDetail);
  }

  onClientNumberInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const rawVal = inputEl.value;

    let sanitized = rawVal.replace(/[^0-9,]/g, '');
    sanitized = sanitized.replace(/,+/g, ',');
    if (sanitized.startsWith(',')) {
      sanitized = sanitized.slice(1);
    }

    if (inputEl.value !== sanitized) {
      inputEl.value = sanitized;
    }

    if (this.formModel().clientNumber !== sanitized) {
      this.formModel.update((current) => ({
        ...current,
        clientNumber: sanitized,
      }));
    }
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
      reconditioning: enabled
        ? { temperature: undefined, tolerance: undefined, timeMin: undefined, timeMax: undefined }
        : undefined,
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

  onDenominationSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.denominationSearchTerm.set(target?.value ?? '');
  }

  onDenominationPanelToggle(opened: boolean): void {
    if (opened) {
      setTimeout(() => {
        this.denominationSearchInputRef()?.nativeElement.focus();
      }, 0);
    } else {
      this.denominationSearchTerm.set('');
    }
  }

  #normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
