import { TitleCasePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
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

import { ShootingConditionsService } from '../../../../services/shooting-conditions.service';
import type {
  MasterDataI18nItem,
  WarehouseDenominationItem,
  WarehousePaginatedResponse,
} from '../../../../utils-models/catalog.model';
import type { ComponentDetail } from '../../../../utils-models/munitions.model';

@Component({
  selector: 'inta-carga-detail-form',
  imports: [
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormField,
    TranslateModule,
    NoLeadingZerosDirective,
    NoNegativeValuesDirective,
  ],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div class="w-full">
        <label for="cp-type" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.TYPE' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input id="cp-type" matInput readonly [value]="componentTypeLabel() | titlecase" />
        </mat-form-field>
      </div>

      <div class="w-full">
        <label
          for="cp-denomination"
          class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.DENOMINATION' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <mat-select
            id="cp-denomination"
            data-testid="denomination-select"
            [value]="denominationId()"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MODEL' | translate"
            (selectionChange)="onDenominationChange($event.value)"
            (openedChange)="onDenominationPanelToggle($event)"
          >
            <div class="px-3 py-2">
              <input
                matInput
                type="text"
                data-testid="denomination-search-input"
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
        <label for="cp-batch" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.LOT' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="cp-batch"
            matInput
            [formField]="detailForm.batch"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT' | translate"
            (blur)="emitChanges()"
          />
        </mat-form-field>
      </div>

      <div class="w-full">
        <label for="cp-errors" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.MAX_FAILURES' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="cp-errors"
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
        <label for="cp-client" class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end">
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.CLIENT_NUMBER' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="cp-client"
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
        <label
          for="cp-zone-modules"
          class="block text-xs font-medium text-gray-600 mb-2 min-h-[2.25rem] flex items-end"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.ZONE_MODULES' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <mat-select
            id="cp-zone-modules"
            [value]="loadingZoneId()"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.ZONE_MODULES' | translate"
            (selectionChange)="onLoadingZoneChange($event.value)"
          >
            @for (zone of filteredLoadingZones(); track zone.id) {
              <mat-option [value]="zone.id">{{ zone.zone }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    <div class="mt-4">
      <label for="cp-observations" class="block text-xs font-medium text-gray-600 mb-2">
        {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.OBSERVATIONS_LABEL' | translate }}
      </label>
      <mat-form-field appearance="outline" class="w-full">
        <textarea
          id="cp-observations"
          matInput
          rows="2"
          [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.OBSERVATIONS_PLACEHOLDER' | translate"
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
export class CargaDetailFormComponent {
  readonly #shootingConditionsService = inject(ShootingConditionsService);
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

  readonly loadingZones = computed(() => this.#shootingConditionsService.getLoadingZonesResource.value() ?? []);

  readonly filteredLoadingZones = computed(() => {
    const denomId = this.denominationId();
    const zones = this.loadingZones();
    if (!denomId) return zones;
    return zones.filter((z) => z.denomination.id === denomId);
  });

  constructor() {
    effect(() => {
      this.#shootingConditionsService.getLoadingZones();
    });
  }

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
  readonly loadingZoneId = computed(() => this.formModel().loadingZoneId ?? '');

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

  onLoadingZoneChange(zoneId: string): void {
    this.formModel.update((current) => ({ ...current, loadingZoneId: zoneId }));
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
