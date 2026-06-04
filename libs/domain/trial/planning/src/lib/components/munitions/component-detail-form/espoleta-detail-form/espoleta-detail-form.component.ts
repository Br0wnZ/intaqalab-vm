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
import { FormField, form, required, validate } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectWharehouseEndpoint } from '@intaqalab/config';
import { NoLeadingZerosDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionsStore } from '../../../../+state/munitions.store';
import type {
  MasterDataI18nItem,
  WarehouseDenominationItem,
  WarehousePaginatedResponse,
} from '../../../../utils-models/catalog.model';
import type { ComponentDetail } from '../../../../utils-models/munitions.model';

@Component({
  selector: 'inta-espoleta-detail-form',
  imports: [
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormField,
    NoLeadingZerosDirective,
    TranslateModule,
  ],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div class="w-full">
        <label for="component-type" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.TYPE' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input id="component-type" matInput readonly [value]="componentTypeLabel() | titlecase" />
        </mat-form-field>
      </div>

      <div class="w-full">
        <label
          for="espoleta-denomination"
          class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.DENOMINATION' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <mat-select
            id="espoleta-denomination"
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
        <label for="espoleta-batch" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.LOT' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="espoleta-batch"
            matInput
            [formField]="detailForm.batch"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT' | translate"
            (blur)="emitChanges()"
          />
        </mat-form-field>
      </div>

      <div class="w-full">
        <label
          for="espoleta-manufacturer"
          class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.MANUFACTURER_NUMBER_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="espoleta-manufacturer"
            matInput
            type="text"
            [formField]="detailForm.clientNumber"
            [placeholder]="
              'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MANUFACTURER_NUMBER' | translate
            "
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

      <div class="w-full">
        <label
          for="espoleta-fuze-mode"
          class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.FUZE_MODE_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <mat-select
            id="espoleta-fuze-mode"
            [value]="fuseWorkingModeId()"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FUZE_MODE' | translate"
            (selectionChange)="onFuseWorkingModeChange($event.value)"
          >
            @for (mode of fuseWorkingModes(); track mode.id) {
              <mat-option [value]="mode.id">{{ mode.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div class="w-full">
        <label
          for="espoleta-measurement"
          class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.FUZE_GRADUATION_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="espoleta-measurement"
            matInput
            type="number"
            libNoLeadingZeros
            [formField]="detailForm.fuseMeasurement"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FUZE_GRADUATION' | translate"
            (blur)="emitChanges()"
          />
        </mat-form-field>
      </div>
    </div>

    <div class="mt-4">
      <label for="espoleta-observations" class="block text-xs font-medium text-gray-600 mb-2">
        {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.OBSERVATIONS_LABEL' | translate }}
      </label>
      <mat-form-field appearance="outline" class="w-full">
        <textarea
          placeholder="{{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.OBSERVATIONS_PLACEHOLDER' | translate }}"
          id="espoleta-observations"
          matInput
          rows="2"
          [formField]="detailForm.observations"
          (blur)="emitChanges()"
        ></textarea>
      </mat-form-field>
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
export class EspoletaDetailFormComponent {
  readonly #munitionsStore = inject(MunitionsStore);
  readonly #warehouseUrl = injectWharehouseEndpoint();

  readonly detail = input.required<ComponentDetail>();
  readonly assignedShotsCount = input<number>(0);
  readonly detailChange = output<ComponentDetail>();

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

  readonly fuseWorkingModes = this.#munitionsStore.fuseWorkingModes;

  readonly formModel = linkedSignal(() => this.detail());

  readonly componentTypeLabel = computed(() => this.detail().type.label || this.detail().type.type);
  readonly denominationId = computed(() => this.formModel().denomination?.id ?? '');
  readonly fuseWorkingModeId = computed(() => this.formModel().fuseWorkingMode?.id ?? '');

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

  emitChanges(): void {
    const value = this.detailForm().value();
    this.detailChange.emit(value as ComponentDetail);
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

  onFuseWorkingModeChange(modeId: string): void {
    const mode = this.fuseWorkingModes().find((m) => m.id === modeId);
    if (mode) {
      this.formModel.update((current) => ({
        ...current,
        fuseWorkingMode: { id: mode.id, type: mode.label, label: mode.label },
      }));
      this.emitChanges();
    }
  }
}
