import { TitleCasePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
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
} from '../../../../utils-models/catalog.model';
import type { ComponentDetail } from '../../../../utils-models/munitions.model';

@Component({
  selector: 'inta-suplemento-detail-form',
  imports: [
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormField,
    NoLeadingZerosDirective,
    NoNegativeValuesDirective,
    TranslateModule,
  ],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div class="w-full">
        <label for="supl-type" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.TYPE' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input id="supl-type" matInput readonly [value]="componentTypeLabel() | titlecase" />
        </mat-form-field>
      </div>

      <div class="w-full">
        <label
          for="supl-denomination"
          class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.DENOMINATION' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <mat-select
            id="supl-denomination"
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
        <label for="supl-batch" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.LOT' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="supl-batch"
            matInput
            [formField]="detailForm.batch"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT' | translate"
            (blur)="emitChanges()"
          />
        </mat-form-field>
      </div>

      <div class="w-full">
        <label for="supl-errors" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.MAX_FAILURES' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="supl-errors"
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
        <label for="supl-client" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.CLIENT_NUMBER' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="supl-client"
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

      <div class="w-full">
        <label for="supl-quantity" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.QUANTITY' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            placeholder="XX"
            id="supl-quantity"
            matInput
            type="number"
            libNoLeadingZeros
            [formField]="detailForm.quantity!"
            (blur)="emitChanges()"
          />
        </mat-form-field>
      </div>
    </div>

    <div class="mt-4">
      <label for="supl-observations" class="block text-xs font-medium text-gray-600 mb-2">
        {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.OBSERVATIONS_LABEL' | translate }}
      </label>
      <mat-form-field appearance="outline" class="w-full">
        <textarea
          placeholder="XX"
          id="supl-observations"
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
export class SuplementoDetailFormComponent {
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

  readonly denominationSearchInputRef = viewChild<ElementRef<HTMLInputElement>>('denominationSearchInput');
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

  readonly formModel = linkedSignal(() => this.detail());

  readonly componentTypeLabel = computed(() => this.detail().type.label || this.detail().type.type);
  readonly denominationId = computed(() => this.formModel().denomination?.id ?? '');

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
