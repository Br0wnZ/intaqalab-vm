import { TitleCasePipe } from '@angular/common';
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
  untracked,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { FormField, disabled, form, min, required } from '@angular/forms/signals';
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
        <!-- Tipo de munición -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2" [for]="'munitionType-' + configIndex()">
            {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MUNITION_TYPE_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              data-testid="munition-type-select"
              [id]="'munitionType-' + configIndex()"
              [value]="selectedMunitionTypeId()"
              [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MUNITION_TYPE_PLACEHOLDER' | translate"
              (selectionChange)="onMunitionTypeChange($event.value)"
            >
              @for (type of munitionTypes(); track type.id) {
                <mat-option [value]="type.id">{{ type.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

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
                  {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.SELECT_ALL_SHOTS' | translate }}
                </mat-checkbox>
              </div>
              @for (shot of shots(); track shot.id) {
                <mat-option [value]="shot.id" [disabled]="excludeShotIds().includes(shot.id)">
                  {{ shot.globalNumber }}
                </mat-option>
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
            [value]="selectableComponentsSelected()"
            [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.COMPONENT_SELECTOR_PLACEHOLDER' | translate"
            (selectionChange)="onComponentsChange($event.value)"
          >
            @for (type of componentTypes(); track type.id) {
              <mat-option [value]="type.label.toLowerCase()">{{ type.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Chips for selected components -->
        @if (selectedComponents().length > 0 || powderTabs().length > 0) {
          <div class="flex flex-wrap gap-2 mt-3">
            <mat-chip-set>
              @for (component of selectedComponents(); track component) {
                @if (
                  component !== 'pólvora' && component !== 'polvora' && !component.toLowerCase().startsWith('polvora-')
                ) {
                  <mat-chip [removable]="true" (removed)="removeComponent(component)">
                    {{ component | titlecase }}
                    <button matChipRemove>
                      <ui-inta-icon name="close" size="xs" color="var(--color-purple-700)" />
                    </button>
                  </mat-chip>
                }
              }
              @if (hasMainPowder()) {
                <mat-chip [removable]="true" (removed)="removeMainPowder()">
                  {{ 'pólvora' | titlecase }}
                  <button matChipRemove>
                    <ui-inta-icon name="close" size="xs" color="var(--color-purple-700)" />
                  </button>
                </mat-chip>
              }
              @for (powder of powderTabs(); track powder.id) {
                <mat-chip [removable]="true" (removed)="removePowder(powder.detail.type.type)">
                  {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.POWDER_INDEX' | translate: { index: powder.index } }}
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
            @if (!component.toLowerCase().startsWith('polvora-')) {
              <mat-tab [label]="component | titlecase">
                <inta-component-detail-form
                  [detail]="getComponentDetail(component)"
                  [assignedShotsCount]="formModel().assignedShotIds?.length ?? 0"
                  (detailChange)="onComponentDetailChange(component, $event)"
                  (addPowder)="onAddPowder(component)"
                />
              </mat-tab>
            }
          }
          @for (powder of powderTabs(); track powder.id) {
            <mat-tab
              [label]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.POWDER_INDEX' | translate: { index: powder.index }"
            >
              <inta-component-detail-form
                [detail]="powder.detail"
                [assignedShotsCount]="formModel().assignedShotIds?.length ?? 0"
                (detailChange)="onPowderDetailChange(powder.detail.type.type, $event)"
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
  readonly denominationSearchInputRef = viewChild<ElementRef<HTMLInputElement>>('denominationSearchInput');
  readonly #munitionsStore = inject(MunitionsStore);

  readonly config = input.required<Configuration>();
  readonly configIndex = input.required<number>();
  readonly shots = input<Shot[]>([]);
  readonly excludeShotIds = input<string[]>([]);
  readonly configChange = output<Configuration>();

  readonly componentTypes = this.#munitionsStore.componentTypes;
  readonly munitionTypes = this.#munitionsStore.munitionTypes;
  readonly denominationsRaw = this.#munitionsStore.denominationsRaw;

  readonly selectedMunitionTypeId = signal<string>('');
  readonly formModel = linkedSignal(() => this.config());
  readonly denominationSearchTerm = signal('');

  readonly selectedComponents = computed(() => this.formModel().selectedComponents ?? []);
  readonly selectableComponentsSelected = computed(() => {
    const allowed = this.componentTypes().map((t) => t.label.toLowerCase());
    return this.selectedComponents().filter((c) => allowed.includes(c.toLowerCase()));
  });
  readonly hasMainPowder = computed(() => {
    return this.selectedComponents().some((c) => c.toLowerCase() === 'polvora' || c.toLowerCase() === 'pólvora');
  });
  readonly eligibleShots = computed(() => {
    const excluded = this.excludeShotIds();
    return this.shots().filter((s) => !excluded.includes(s.id));
  });

  readonly allShotsSelected = computed(() => {
    const eligible = this.eligibleShots();
    const assigned = this.formModel().assignedShotIds ?? [];
    return eligible.length > 0 && eligible.every((s) => assigned.includes(s.id));
  });

  readonly someShotsSelected = computed(() => {
    const eligible = this.eligibleShots();
    const assigned = this.formModel().assignedShotIds ?? [];
    return assigned.length > 0 && !eligible.every((s) => assigned.includes(s.id));
  });
  readonly filteredDenominations = computed(() => {
    const munitionTypeId = this.selectedMunitionTypeId();
    const allDenominations = this.denominationsRaw();

    // Filter by selected munition type
    const byType = munitionTypeId ? allDenominations.filter((d) => d.munitionType?.id === munitionTypeId) : [];

    const term = this.#normalizeText(this.denominationSearchTerm());
    if (!term)
      return byType.map((d) => ({ id: d.id, label: d.name, name: { es: d.name, en: d.name }, active: d.active }));

    return byType
      .filter((d) => this.#normalizeText(d.name).includes(term))
      .map((d) => ({ id: d.id, label: d.name, name: { es: d.name, en: d.name }, active: d.active }));
  });

  readonly isConditioningEnabled = computed(() => hasReconditioning(this.formModel().reconditioning));

  readonly powderTabs = computed(() => {
    const components = this.formModel().components ?? [];
    const powders = components.filter((c) => {
      const type = c.type.type
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return type.startsWith('polvora-');
    });

    return powders.map((c, index) => {
      const match = c.type.type.match(/\d+/);
      const idx = match ? parseInt(match[0], 10) : index + 1;
      return {
        id: c.id || c.type.type,
        index: idx,
        detail: c,
      };
    });
  });

  readonly conditioningData = computed<ReconditioningData>(() => {
    return this.formModel().reconditioning ?? {};
  });

  constructor() {
    effect(() => {
      const config = this.config();
      const shots = this.shots();
      if (shots.length > 0 && (!config.assignedShotIds || config.assignedShotIds.length === 0)) {
        untracked(() => {
          const eligibleIds = this.eligibleShots().map((s) => s.id);
          this.formModel.update((current) => ({
            ...current,
            assignedShotIds: eligibleIds.length > 0 ? eligibleIds : null,
          }));
          this.emitChanges();
        });
      }
    });
  }

  readonly configForm = form(this.formModel, (f) => {
    required(f.batch);
    disabled(f.denomination, () => !this.selectedMunitionTypeId());
    min(f.maxAllowedErrors, 0);
  });

  emitChanges(): void {
    this.configChange.emit(this.formModel());
  }

  onDenominationSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.denominationSearchTerm.set(target?.value ?? '');
  }

  onDenominationPanelToggle(opened: boolean): void {
    if (opened) {
      // Autofocus the search input when the panel opens
      setTimeout(() => {
        this.denominationSearchInputRef()?.nativeElement.focus();
      }, 0);
    } else {
      this.denominationSearchTerm.set('');
    }
  }

  onMunitionTypeChange(munitionTypeId: string): void {
    this.selectedMunitionTypeId.set(munitionTypeId);
  }

  #normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  onSelectAllShots(checked: boolean): void {
    const ids = checked ? this.eligibleShots().map((s) => s.id) : [];
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

    const hasPowder = components.some((c) => c.toLowerCase() === 'polvora' || c.toLowerCase() === 'pólvora');
    const filteredComponents = existingComponents.filter((d) => {
      const typeNormalized = d.type.type
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (typeNormalized.startsWith('polvora-')) {
        return hasPowder;
      }
      return components.includes(d.type.type.toLowerCase());
    });

    const updatedSelectedComponents = [...components];
    if (hasPowder) {
      const extraPowders = existingComponents
        .filter((d) => {
          const typeNormalized = d.type.type
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          return typeNormalized.startsWith('polvora-');
        })
        .map((d) => d.type.type.toLowerCase());

      updatedSelectedComponents.push(...extraPowders);
    }

    this.formModel.update((c) => ({
      ...c,
      selectedComponents: updatedSelectedComponents,
      components: filteredComponents,
    }));
    this.emitChanges();
  }

  removeMainPowder(): void {
    this.removeComponent('pólvora');
  }

  removePowder(powderType: string): void {
    this.formModel.update((current) => {
      const remainingComponents = current.components.filter((c) => c.type.type !== powderType);

      let powderCount = 0;
      const updatedComponents = remainingComponents.map((c) => {
        const type = c.type.type
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        if (type.startsWith('polvora-')) {
          powderCount++;
          return {
            ...c,
            type: {
              ...c.type,
              type: `polvora-${powderCount}`,
              label: `Pólvora ${powderCount}`,
            },
          };
        }
        return c;
      });

      const remainingSelected = (current.selectedComponents ?? []).filter((c) => c !== powderType);
      const nonPowderSelected = remainingSelected.filter((c) => {
        const type = c
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return type !== 'polvora' && type !== 'pólvora' && !type.startsWith('polvora-');
      });

      const hasMain = remainingSelected.some((c) => c.toLowerCase() === 'polvora' || c.toLowerCase() === 'pólvora');

      const newSelectedComponents = [...nonPowderSelected];
      if (hasMain) {
        newSelectedComponents.push('pólvora');
        for (let i = 1; i <= powderCount; i++) {
          newSelectedComponents.push(`polvora-${i}`);
        }
      }

      return {
        ...current,
        selectedComponents: newSelectedComponents,
        components: updatedComponents,
      };
    });
    this.emitChanges();
  }

  removeComponent(component: string): void {
    this.formModel.update((current) => {
      const isPowder = component.toLowerCase() === 'pólvora' || component.toLowerCase() === 'polvora';

      let remainingComponents = current.components;
      let remainingSelected = current.selectedComponents ?? [];

      if (isPowder) {
        remainingComponents = current.components.filter((c) => {
          const type = c.type.type
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          return type !== 'polvora' && type !== 'pólvora' && !type.startsWith('polvora-');
        });
        remainingSelected = remainingSelected.filter(
          (c) =>
            c.toLowerCase() !== 'polvora' && c.toLowerCase() !== 'pólvora' && !c.toLowerCase().startsWith('polvora-'),
        );
      } else {
        remainingComponents = current.components.filter((d) => d.type.type.toLowerCase() !== component);
        remainingSelected = remainingSelected.filter((c) => c !== component);
      }

      return {
        ...current,
        selectedComponents: remainingSelected,
        components: remainingComponents,
      };
    });
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
    const currentComponents = this.formModel().components ?? [];

    const powders = currentComponents.filter((c) => {
      const type = c.type.type
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return type.startsWith('polvora-');
    });

    const nextIndex = powders.length + 1;
    const typeValue = `polvora-${nextIndex}`;

    const newPowderDetail = createEmptyComponentDetail(typeValue);

    const matchedType = this.componentTypes().find(
      (t) => t.label.toLowerCase() === 'pólvora' || t.label.toLowerCase() === 'polvora',
    );
    if (matchedType) {
      newPowderDetail.type = {
        id: matchedType.id,
        type: typeValue,
        label: `Pólvora ${nextIndex}`,
      };
    }

    const updatedSelected = [...(this.formModel().selectedComponents ?? [])];
    if (!updatedSelected.includes(typeValue)) {
      updatedSelected.push(typeValue);
    }

    this.formModel.update((current) => ({
      ...current,
      selectedComponents: updatedSelected,
      components: [...current.components, newPowderDetail],
    }));

    this.emitChanges();
  }

  onPowderDetailChange(powderType: string, detail: ComponentDetail): void {
    this.formModel.update((current) => {
      const updatedComponents = current.components.map((c) => {
        if (c.type.type === powderType) {
          return detail;
        }
        return c;
      });
      return {
        ...current,
        components: updatedComponents,
      };
    });
    this.emitChanges();
  }
}
