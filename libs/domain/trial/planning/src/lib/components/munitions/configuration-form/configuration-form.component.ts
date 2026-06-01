import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  ViewEncapsulation,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { FormField, form, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { IntaIconComponent } from '@intaqalab/ui';
import { NoLeadingZerosDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionsStore } from '../../../+state/munitions.store';
import type { ComponentDetail, Configuration, ReconditioningData } from '../../../utils-models/munitions.model';
import { createEmptyComponentDetail, hasReconditioning } from '../../../utils-models/munitions.model';
import type { Shot } from '../../../utils-models/series-and-shots.model';
import { ComponentDetailFormComponent } from '../component-detail-form/component-detail-form.component';
import { ConditioningFieldsComponent } from '../conditioning-fields/conditioning-fields.component';

@Component({
  selector: 'inta-configuration-form',
  imports: [
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTabsModule,
    FormField,
    ConditioningFieldsComponent,
    ComponentDetailFormComponent,
    NoLeadingZerosDirective,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <div class="bg-gray-200 p-6 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Denominación -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2" [for]="'denomination-' + configIndex()">
            {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.DENOMINATION_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              data-testid="denomination-select"
              [formField]="configForm.denomination"
              [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.OPTIONS.SELECT' | translate"
              [id]="'denomination-' + configIndex()"
              (selectionChange)="emitChanges()"
              (openedChange)="onDenominationPanelToggle($event)"
            >
              <div class="px-3 py-2">
                <input
                  placeholder="Buscar denominacion"
                  matInput
                  type="text"
                  data-testid="denomination-search-input"
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
                <mat-option disabled>Sin resultados</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Lote (batch) -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2" [for]="'batch-' + configIndex()">
            {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.LOT_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              matInput
              data-testid="batch-input"
              [formField]="configForm.batch"
              [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.LOT_PLACEHOLDER' | translate"
              [id]="'batch-' + configIndex()"
              (blur)="emitChanges()"
            />
          </mat-form-field>
        </div>

        <!-- Disparos asociados (assignedShotIds) - Select múltiple -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2" [for]="'assignedShotIds-' + configIndex()">
            {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.ASSOCIATED_SHOTS_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              multiple
              data-testid="assigned-shots-select"
              [id]="'assignedShotIds-' + configIndex()"
              [value]="formModel().assignedShotIds ?? []"
              [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.ASSOCIATED_SHOTS' | translate"
              (selectionChange)="onAssignedShotsSelectChange($event.value)"
            >
              <div class="px-3 py-2 border-b border-gray-200">
                <mat-checkbox
                  data-testid="select-all-shots-checkbox"
                  [checked]="allShotsSelected()"
                  [indeterminate]="someShotsSelected()"
                  (change)="onSelectAllShots($event.checked)"
                  (click)="$event.stopPropagation()"
                  (keydown)="$event.stopPropagation()"
                >
                  Seleccionar todos
                </mat-checkbox>
              </div>
              @for (shot of shots(); track shot.id) {
                <mat-option [value]="shot.id">{{ shot.globalNumber }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Nº máx. fallos permitido (maxAllowedErrors) -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2" [for]="'maxAllowedErrors-' + configIndex()">
            {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MAX_FAILURES_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              matInput
              type="number"
              data-testid="max-errors-input"
              libNoLeadingZeros
              [formField]="configForm.maxAllowedErrors"
              [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MAX_FAILURES_PLACEHOLDER' | translate"
              [id]="'maxAllowedErrors-' + configIndex()"
              (blur)="emitChanges()"
            />
          </mat-form-field>
        </div>
      </div>

      <!-- Second row: Observations -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-2" [for]="'observations-' + configIndex()">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.OBSERVATIONS_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <textarea
            placeholder="{{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.OBSERVATIONS_PLACEHOLDER' | translate }}"
            matInput
            rows="2"
            [formField]="configForm.observations"
            [id]="'observations-' + configIndex()"
            (blur)="emitChanges()"
          ></textarea>
        </mat-form-field>
      </div>

      <!-- Conditioning Checkbox -->
      <div class="flex justify-end">
        <mat-checkbox
          data-testid="conditioning-checkbox"
          class="!text-gray-700"
          [checked]="isConditioningEnabled()"
          (change)="onConditioningToggle($event.checked)"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.CONDITIONING_CHECKBOX' | translate }}
        </mat-checkbox>
      </div>

      @if (isConditioningEnabled()) {
        <inta-conditioning-fields [data]="conditioningData()" (dataChange)="onConditioningChange($event)" />
      }

      <!-- Component Selector -->
      <div class="border-t pt-4 border-gray-700">
        <label class="block text-xs font-medium text-gray-600 mb-2" [for]="'selectedComponents-' + configIndex()">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.COMPONENT_SELECTOR_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <mat-select
            multiple
            [id]="'selectedComponents-' + configIndex()"
            [value]="selectedComponents()"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.COMPONENT_SELECTOR_PLACEHOLDER' | translate"
            (selectionChange)="onComponentsChange($event.value)"
          >
            @for (type of componentTypes(); track type.id) {
              <mat-option [value]="type.label.toLowerCase()">{{ type.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Chips for selected components -->
        @if (selectedComponents().length > 0) {
          <div class="flex flex-wrap gap-2 mt-3">
            <mat-chip-set>
              @for (component of selectedComponents(); track component) {
                <mat-chip [removable]="true" (removed)="removeComponent(component)">
                  {{ component | titlecase }}
                  <button matChipRemove>
                    <ui-inta-icon name="close" size="xs" color="var(--color-purple-700)" />
                  </button>
                </mat-chip>
              }
            </mat-chip-set>
          </div>
        }
      </div>

      <!-- Component Tabs -->
      @if (selectedComponents().length > 0) {
        <mat-tab-group class="mt-4">
          @for (component of selectedComponents(); track component) {
            <mat-tab [label]="component | titlecase">
              <inta-component-detail-form
                [detail]="getComponentDetail(component)"
                (detailChange)="onComponentDetailChange(component, $event)"
                (addPowder)="onAddPowder(component)"
              />
            </mat-tab>
          }
          @for (powder of powderTabs(); track powder.id) {
            <mat-tab [label]="'Pólvora ' + powder.index">
              <inta-component-detail-form
                [detail]="powder.detail"
                (detailChange)="onPowderDetailChange(powder.id, $event)"
                (addPowder)="onAddPowder('polvora')"
              />
            </mat-tab>
          }
        </mat-tab-group>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    ::ng-deep mat-chip {
      background-color: #e5e7eb !important;
      color: #374151 !important;
    }

    ::ng-deep mat-chip button[matChipRemove] {
      color: #6b7280 !important;
    }

    ::ng-deep .mat-mdc-tab-label {
      min-width: 120px !important;
      text-transform: capitalize;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationFormComponent {
  @ViewChild('denominationSearchInput') denominationSearchInputRef?: ElementRef<HTMLInputElement>;
  readonly #munitionsStore = inject(MunitionsStore);

  readonly config = input.required<Configuration>();
  readonly configIndex = input.required<number>();
  readonly shots = input<Shot[]>([]);
  readonly configChange = output<Configuration>();

  readonly componentTypes = this.#munitionsStore.componentTypes;
  readonly denominations = this.#munitionsStore.denominations;

  readonly formModel = linkedSignal(() => this.config());
  readonly denominationSearchTerm = signal('');

  readonly selectedComponents = computed(() => this.formModel().selectedComponents ?? []);
  readonly allShotsSelected = computed(() => {
    const shots = this.shots();
    const assigned = this.formModel().assignedShotIds ?? [];
    return shots.length > 0 && shots.every((s) => assigned.includes(s.id));
  });
  readonly someShotsSelected = computed(() => {
    const shots = this.shots();
    const assigned = this.formModel().assignedShotIds ?? [];
    return assigned.length > 0 && !shots.every((s) => assigned.includes(s.id));
  });
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

  readonly isConditioningEnabled = computed(() => hasReconditioning(this.formModel().reconditioning));

  readonly powderTabs = signal<{ id: string; index: number; detail: ComponentDetail }[]>([]);

  readonly conditioningData = computed<ReconditioningData>(() => {
    return this.formModel().reconditioning ?? {};
  });

  readonly configForm = form(this.formModel, (f) => {
    required(f.denomination);
    required(f.batch);
    min(f.maxAllowedErrors, 0);
  });

  emitChanges(): void {
    const value = this.configForm().value();
    this.configChange.emit(value as Configuration);
  }

  onDenominationSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.denominationSearchTerm.set(target?.value ?? '');
  }

  onDenominationPanelToggle(opened: boolean): void {
    if (opened) {
      // Autofocus the search input when the panel opens
      setTimeout(() => {
        this.denominationSearchInputRef?.nativeElement.focus();
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

  onSelectAllShots(checked: boolean): void {
    const ids = checked ? this.shots().map((s) => s.id) : [];
    this.formModel.update((current) => ({
      ...current,
      assignedShotIds: ids.length > 0 ? ids : null,
    }));
    this.emitChanges();
  }

  onAssignedShotsSelectChange(ids: string[]): void {
    this.formModel.update((current) => ({
      ...current,
      assignedShotIds: ids.length > 0 ? ids : null,
    }));
    this.emitChanges();
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

  onComponentsChange(components: string[]): void {
    const current = this.formModel();
    const existingComponents = [...current.components];
    const types = this.componentTypes();

    for (const comp of components) {
      const exists = existingComponents.find((d) => d.type.type.toLowerCase() === comp);
      if (!exists) {
        const matchedType = types.find((t) => t.label.toLowerCase() === comp);
        const detail = createEmptyComponentDetail(comp);
        if (matchedType) {
          detail.type = { id: matchedType.id, type: comp, label: matchedType.label };
        }
        existingComponents.push(detail);
      }
    }
    const filteredComponents = existingComponents.filter((d) => components.includes(d.type.type.toLowerCase()));

    this.formModel.update((c) => ({
      ...c,
      selectedComponents: components,
      components: filteredComponents,
    }));
    this.emitChanges();
  }

  removeComponent(component: string): void {
    this.formModel.update((current) => ({
      ...current,
      selectedComponents: (current.selectedComponents ?? []).filter((c) => c !== component),
      components: current.components.filter((d) => d.type.type.toLowerCase() !== component),
    }));
    this.emitChanges();
  }

  getComponentDetail(componentType: string): ComponentDetail {
    const detail = this.formModel().components.find((d) => d.type.type.toLowerCase() === componentType);
    return detail ?? createEmptyComponentDetail(componentType);
  }

  onComponentDetailChange(componentType: string, detail: ComponentDetail): void {
    this.formModel.update((current) => {
      const existingIndex = current.components.findIndex((d) => d.type.type.toLowerCase() === componentType);
      const updatedComponents = [...current.components];

      if (existingIndex >= 0) {
        updatedComponents[existingIndex] = detail;
      } else {
        updatedComponents.push(detail);
      }

      return {
        ...current,
        components: updatedComponents,
      };
    });
    this.emitChanges();
  }

  onAddPowder(_componentType: string): void {
    void _componentType;
    const currentPowders = this.powderTabs();
    const nextIndex = currentPowders.length + 1;
    const newPowder = {
      id: `powder-${Date.now()}`,
      index: nextIndex,
      detail: createEmptyComponentDetail(`polvora-${nextIndex}`),
    };
    this.powderTabs.update((powders) => [...powders, newPowder]);
  }

  onPowderDetailChange(powderId: string, detail: ComponentDetail): void {
    this.powderTabs.update((powders) => powders.map((p) => (p.id === powderId ? { ...p, detail } : p)));
  }
}
