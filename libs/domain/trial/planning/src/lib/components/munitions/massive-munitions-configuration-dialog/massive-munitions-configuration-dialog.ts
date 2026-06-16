import { CommonModule } from '@angular/common';
import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { IntaIconComponent } from '@intaqalab/ui';
import { NoLeadingZerosDirective } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MunitionsStore } from '../../../+state/munitions.store';
import { SeriesAndShotsStore } from '../../../+state/series-and-shots.store';
import type {
  ComponentDetail,
  MassiveConfigDialogData,
  MassiveConfigFormData,
  MunitionBulkUpdateRequest,
  MunitionConfigRequest,
  ReconditioningData,
} from '../../../utils-models/munitions.model';
import {
  createEmptyComponentDetail,
  createEmptyMassiveConfigFormData,
  createEmptyReconditioning,
} from '../../../utils-models/munitions.model';
import { CargaDetailFormComponent } from '../component-detail-form/carga-detail-form/carga-detail-form.component';
import { EspoletaDetailFormComponent } from '../component-detail-form/espoleta-detail-form/espoleta-detail-form.component';
import { SuplementoDetailFormComponent } from '../component-detail-form/suplemento-detail-form/suplemento-detail-form.component';

@Component({
  selector: 'inta-massive-munitions-configuration-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTabsModule,
    TranslateModule,
    IntaIconComponent,
    NoLeadingZerosDirective,
    EspoletaDetailFormComponent,
    SuplementoDetailFormComponent,
    CargaDetailFormComponent,
  ],
  template: `
    <div>
      <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
        <ui-inta-icon name="edit" size="xxl" />
        {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.TITLE' | translate }}
      </h2>

      <mat-dialog-content class="!px-6 !py-6">
        <div class="space-y-6">
          <div class="grid grid-cols-6 gap-4">
            <!-- Tipo de munición -->
            <div>
              <label for="munitionType" class="block text-xs font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MUNITION_TYPE_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <mat-select
                  id="munitionType"
                  data-testid="munition-type-select"
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
              <label for="denomination" class="block text-xs font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.DENOMINATION_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <mat-select
                  id="denomination"
                  data-testid="denomination-select"
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.OPTIONS.SELECT' | translate"
                  [disabled]="!selectedMunitionTypeId()"
                  [(ngModel)]="formData.denomination"
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

            <!-- Lote -->
            <div>
              <label for="batch" class="block text-xs font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.LOT_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <input
                  id="batch"
                  matInput
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.LOT_PLACEHOLDER' | translate"
                  [(ngModel)]="formData.batch"
                />
              </mat-form-field>
            </div>

            <!-- Disparos asociados (selector) -->
            <div>
              <label for="assignedShotIds" class="block text-xs font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.ASSOCIATED_SHOTS_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <mat-select
                  id="assignedShotIds"
                  multiple
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.ASSOCIATED_SHOTS' | translate"
                  [(ngModel)]="formData.assignedShotIds"
                >
                  <div class="px-3 py-2 border-b border-gray-200">
                    <mat-checkbox
                      [checked]="allShotsSelected()"
                      [indeterminate]="someShotsSelected()"
                      (change)="onSelectAllShots($event.checked)"
                      (click)="$event.stopPropagation()"
                      (keydown)="$event.stopPropagation()"
                    >
                      {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.SELECT_ALL_SHOTS' | translate }}
                    </mat-checkbox>
                  </div>
                  @for (shot of allShots(); track shot.id) {
                    <mat-option [value]="shot.id">Disparo {{ shot.globalNumber }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Nº máx. fallos permitido -->
            <div>
              <label for="maxAllowedErrors" class="block text-xs font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.MAX_FAILURES_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <input
                  id="maxAllowedErrors"
                  matInput
                  type="number"
                  min="0"
                  libNoLeadingZeros
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MAX_FAILURES_PLACEHOLDER' | translate"
                  [(ngModel)]="formData.maxAllowedErrors"
                  (keydown)="
                    $event.key === '-' || $event.key === '+' || $event.key === 'e' || $event.key === '.'
                      ? $event.preventDefault()
                      : null
                  "
                />
              </mat-form-field>
            </div>

            <!-- Nº de cliente -->
            <div>
              <label for="clientNumber" class="block text-xs font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CLIENT_NUMBER_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <input
                  id="clientNumber"
                  matInput
                  type="text"
                  [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.CLIENT' | translate"
                  [ngModel]="formData.clientNumber"
                  (input)="onClientNumberInput($event)"
                />
              </mat-form-field>
              @if (getClientNumberError(formData.clientNumber)) {
                <div class="text-red-600 text-xs mt-1">
                  {{ getClientNumberError(formData.clientNumber) }}
                </div>
              }
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label for="observations" class="block text-xs font-medium text-gray-700 mb-2">
              {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.OBSERVATIONS_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <textarea
                id="observations"
                matInput
                rows="2"
                [placeholder]="'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.OBSERVATIONS_PLACEHOLDER' | translate"
                [(ngModel)]="formData.observations"
              ></textarea>
            </mat-form-field>
          </div>

          <!-- Checkbox Acondicionamiento -->
          <div class="flex justify-end">
            <mat-checkbox
              class="!text-gray-700"
              [checked]="isConditioningEnabled"
              (change)="onConditioningToggle($event.checked)"
            >
              {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX' | translate }}
            </mat-checkbox>
          </div>

          @if (isConditioningEnabled) {
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <!-- Temperatura acondicionamiento -->
              <div>
                <label for="temperature" class="block text-xs font-medium text-gray-700 mb-2">
                  {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                  <input
                    placeholder="0"
                    id="temperature"
                    matInput
                    type="number"
                    libNoLeadingZeros
                    [value]="formData.reconditioning?.temperature ?? ''"
                    (keydown)="onDecimalKeydown($event)"
                    (input)="onReconditioningFieldChange('temperature', $any($event.target).valueAsNumber)"
                  />
                </mat-form-field>
              </div>

              <!-- Tolerancia -->
              <div>
                <label for="tolerance" class="block text-xs font-medium text-gray-700 mb-2">
                  {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TOLERANCE_LABEL' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                  <input
                    placeholder="0"
                    id="tolerance"
                    matInput
                    type="number"
                    libNoLeadingZeros
                    [value]="formData.reconditioning?.tolerance ?? ''"
                    (keydown)="onDecimalKeydown($event)"
                    (input)="onReconditioningFieldChange('tolerance', $any($event.target).valueAsNumber)"
                  />
                </mat-form-field>
              </div>

              <!-- Tiempo mínimo -->
              <div>
                <label for="timeMin" class="block text-xs font-medium text-gray-700 mb-2">
                  {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MIN_TIME_LABEL' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                  <input
                    placeholder="0"
                    id="timeMin"
                    matInput
                    type="number"
                    libNoLeadingZeros
                    [value]="formData.reconditioning?.timeMin ?? ''"
                    (keydown)="onDecimalKeydown($event)"
                    (input)="onReconditioningFieldChange('timeMin', $any($event.target).valueAsNumber)"
                  />
                </mat-form-field>
              </div>

              <!-- Tiempo máximo -->
              <div>
                <label for="timeMax" class="block text-xs font-medium text-gray-700 mb-2">
                  {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MAX_TIME_LABEL' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                  <input
                    placeholder="0"
                    id="timeMax"
                    matInput
                    type="number"
                    libNoLeadingZeros
                    [value]="formData.reconditioning?.timeMax ?? ''"
                    (keydown)="onDecimalKeydown($event)"
                    (input)="onReconditioningFieldChange('timeMax', $any($event.target).valueAsNumber)"
                  />
                </mat-form-field>
              </div>
            </div>

            <!-- Observaciones reconditioning -->
            <div>
              <label for="reconditioningObservations" class="block text-xs font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.OBSERVATIONS_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                <textarea
                  placeholder="{{
                    'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.OBSERVATIONS_PLACEHOLDER' | translate
                  }}"
                  id="reconditioningObservations"
                  matInput
                  rows="2"
                  [value]="formData.reconditioning?.observations ?? ''"
                  (input)="onReconditioningFieldChange('observations', $any($event.target).value)"
                ></textarea>
              </mat-form-field>
            </div>
          }

          <!-- Selector de componentes -->
          <div class="border-t border-gray-200 pt-4">
            <label for="selectedComponents" class="block text-xs font-medium text-gray-700 mb-2">
              {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.COMPONENT_SELECTOR_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <mat-select
                id="selectedComponents"
                multiple
                [placeholder]="
                  'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.COMPONENT_SELECTOR_PLACEHOLDER' | translate
                "
                [(ngModel)]="formData.selectedComponents"
              >
                @for (type of filteredComponentTypes(); track type.id) {
                  <mat-option [value]="type.label.toLowerCase()">{{ type.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (formData.selectedComponents.length > 0) {
              <div class="flex flex-wrap gap-2 mt-3">
                <mat-chip-set>
                  @for (component of formData.selectedComponents; track component) {
                    <mat-chip [removable]="true" (removed)="removeComponent(component)">
                      {{ getComponentLabel(component) }}
                      <button matChipRemove>
                        <ui-inta-icon name="close" size="xs" color="var(--color-purple-700)" />
                      </button>
                    </mat-chip>
                  }
                </mat-chip-set>
              </div>
            }
          </div>

          @if (formData.selectedComponents.length > 0) {
            <mat-tab-group class="inta-tabs-2">
              @for (component of formData.selectedComponents; track component) {
                <mat-tab [label]="getComponentLabel(component)">
                  <div class="mt-4">
                    @switch (component) {
                      @case ('espoleta') {
                        <inta-espoleta-detail-form
                          [detail]="getComponentData(component)"
                          [assignedShotsCount]="formData.assignedShotIds?.length ?? 0"
                          (detailChange)="onComponentSubFormChange(component, $event)"
                        />
                      }
                      @case ('suplemento') {
                        <inta-suplemento-detail-form
                          [detail]="getComponentData(component)"
                          [assignedShotsCount]="formData.assignedShotIds?.length ?? 0"
                          (detailChange)="onComponentSubFormChange(component, $event)"
                        />
                      }
                      @case ('carga de proyección') {
                        <inta-carga-detail-form
                          [detail]="getComponentData(component)"
                          [assignedShotsCount]="formData.assignedShotIds?.length ?? 0"
                          (detailChange)="onComponentSubFormChange(component, $event)"
                        />
                      }
                      @default {
                        <div class="grid grid-cols-[150px_200px_150px_200px_150px] gap-4 mb-3">
                          <div class="text-xs font-medium text-gray-600">
                            {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.TYPE' | translate }}
                          </div>
                          <div class="text-xs font-medium text-gray-600">
                            {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.DENOMINATION' | translate }}
                          </div>
                          <div class="text-xs font-medium text-gray-600">
                            {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.LOT' | translate }}
                          </div>
                          <div class="text-xs font-medium text-gray-600">
                            {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.MAX_FAILURES' | translate }}
                          </div>
                          <div class="text-xs font-medium text-gray-600">
                            {{ 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.CLIENT_NUMBER' | translate }}
                          </div>
                        </div>

                        <div class="grid grid-cols-[150px_200px_150px_200px_150px] gap-4 items-start mb-4">
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <input matInput readonly class="!bg-gray-50" [value]="getComponentLabel(component)" />
                          </mat-form-field>

                          <!-- Denominación -->
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <mat-select
                              data-testid="denomination-select"
                              [placeholder]="
                                'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MODEL' | translate
                              "
                              [(ngModel)]="getComponentData(component).denomination.id"
                              (selectionChange)="onComponentDenominationChange(component, $event.value)"
                              (openedChange)="onDenominationPanelToggle($event)"
                            >
                              <div class="px-3 py-2">
                                <input
                                  matInput
                                  type="text"
                                  data-testid="denomination-search-input"
                                  [placeholder]="
                                    'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.SEARCH_PLACEHOLDER' | translate
                                  "
                                  [value]="denominationSearchTerm()"
                                  (input)="onDenominationSearchInput($event)"
                                  (keydown)="$event.stopPropagation()"
                                  (click)="$event.stopPropagation()"
                                  (mousedown)="$event.stopPropagation()"
                                  #denominationSearchInput
                                />
                              </div>
                              @for (denom of filteredComponentDenominations(); track denom.id) {
                                <mat-option [value]="denom.id">{{ denom.label }}</mat-option>
                              }
                              @if (filteredComponentDenominations().length === 0) {
                                <mat-option disabled>
                                  {{ 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.NO_RESULTS' | translate }}
                                </mat-option>
                              }
                            </mat-select>
                          </mat-form-field>

                          <!-- Lote -->
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <input
                              matInput
                              [placeholder]="
                                'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT' | translate
                              "
                              [(ngModel)]="getComponentData(component).batch"
                            />
                          </mat-form-field>

                          <!-- Nº fallos -->
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <input
                              matInput
                              type="number"
                              min="0"
                              libNoLeadingZeros
                              [placeholder]="
                                'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FAILURES' | translate
                              "
                              [(ngModel)]="getComponentData(component).maxAllowedErrors"
                              (keydown)="
                                $event.key === '-' || $event.key === '+' || $event.key === 'e' || $event.key === '.'
                                  ? $event.preventDefault()
                                  : null
                              "
                            />
                          </mat-form-field>

                          <!-- Nº cliente -->
                          <div class="w-full">
                            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                              <input
                                matInput
                                type="text"
                                [placeholder]="
                                  'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.CLIENT' | translate
                                "
                                [ngModel]="getComponentData(component).clientNumber"
                                (input)="onComponentClientNumberInput(component, $event)"
                              />
                            </mat-form-field>
                            @if (getClientNumberError(getComponentData(component).clientNumber)) {
                              <div class="text-red-600 text-xs mt-1">
                                {{ getClientNumberError(getComponentData(component).clientNumber) }}
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Observaciones -->
                        <div class="mb-4">
                          <label
                            class="block text-xs font-medium text-gray-600 mb-2"
                            [for]="'component-observations-' + component"
                          >
                            {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.OBSERVATIONS_LABEL' | translate }}
                          </label>
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <textarea
                              placeholder="{{
                                'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.OBSERVATIONS_PLACEHOLDER' | translate
                              }}"
                              matInput
                              rows="2"
                              [id]="'component-observations-' + component"
                              [(ngModel)]="getComponentData(component).observations"
                            ></textarea>
                          </mat-form-field>
                        </div>
                      }
                    }

                    <div class="flex justify-end">
                      <mat-checkbox
                        class="!text-gray-700"
                        [checked]="isComponentConditioningEnabled(component)"
                        (change)="onComponentConditioningToggle(component, $event.checked)"
                      >
                        {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CONDITIONING_CHECKBOX' | translate }}
                      </mat-checkbox>
                    </div>

                    @if (isComponentConditioningEnabled(component)) {
                      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
                        <div>
                          <label
                            class="block text-xs font-medium text-gray-600 mb-2"
                            [for]="'component-temperature-' + component"
                          >
                            {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL' | translate }}
                          </label>
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <input
                              placeholder="00"
                              matInput
                              type="number"
                              libNoLeadingZeros
                              [id]="'component-temperature-' + component"
                              [value]="getComponentData(component).reconditioning?.temperature ?? ''"
                              (keydown)="onDecimalKeydown($event)"
                              (input)="
                                onComponentReconditioningChange(
                                  component,
                                  'temperature',
                                  $any($event.target).valueAsNumber
                                )
                              "
                            />
                          </mat-form-field>
                        </div>

                        <div>
                          <label
                            class="block text-xs font-medium text-gray-600 mb-2"
                            [for]="'component-tolerance-' + component"
                          >
                            {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TOLERANCE_LABEL' | translate }}
                          </label>
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <input
                              placeholder="00"
                              matInput
                              type="number"
                              libNoLeadingZeros
                              [id]="'component-tolerance-' + component"
                              [value]="getComponentData(component).reconditioning?.tolerance ?? ''"
                              (keydown)="onDecimalKeydown($event)"
                              (input)="
                                onComponentReconditioningChange(
                                  component,
                                  'tolerance',
                                  $any($event.target).valueAsNumber
                                )
                              "
                            />
                          </mat-form-field>
                        </div>

                        <div>
                          <label
                            class="block text-xs font-medium text-gray-600 mb-2"
                            [for]="'component-timeMin-' + component"
                          >
                            {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MIN_TIME_LABEL' | translate }}
                          </label>
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <input
                              placeholder="00"
                              matInput
                              type="number"
                              libNoLeadingZeros
                              [id]="'component-timeMin-' + component"
                              [value]="getComponentData(component).reconditioning?.timeMin ?? ''"
                              (keydown)="onDecimalKeydown($event)"
                              (input)="
                                onComponentReconditioningChange(component, 'timeMin', $any($event.target).valueAsNumber)
                              "
                            />
                          </mat-form-field>
                        </div>

                        <div>
                          <label
                            class="block text-xs font-medium text-gray-600 mb-2"
                            [for]="'component-timeMax-' + component"
                          >
                            {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MAX_TIME_LABEL' | translate }}
                          </label>
                          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                            <input
                              placeholder="00"
                              matInput
                              type="number"
                              libNoLeadingZeros
                              [id]="'component-timeMax-' + component"
                              [value]="getComponentData(component).reconditioning?.timeMax ?? ''"
                              (keydown)="onDecimalKeydown($event)"
                              (input)="
                                onComponentReconditioningChange(component, 'timeMax', $any($event.target).valueAsNumber)
                              "
                            />
                          </mat-form-field>
                        </div>
                      </div>

                      <div class="mt-4">
                        <label
                          class="block text-xs font-medium text-gray-600 mb-2"
                          [for]="'component-reconditioningObservations-' + component"
                        >
                          {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.OBSERVATIONS_LABEL' | translate }}
                        </label>
                        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                          <textarea
                            matInput
                            rows="2"
                            [placeholder]="
                              'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.OBSERVATIONS_LABEL' | translate
                            "
                            [id]="'component-reconditioningObservations-' + component"
                            [value]="getComponentData(component).reconditioning?.observations ?? ''"
                            (input)="
                              onComponentReconditioningChange(component, 'observations', $any($event.target).value)
                            "
                          ></textarea>
                        </mat-form-field>
                      </div>
                    }
                  </div>
                </mat-tab>
              }
            </mat-tab-group>
          }
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="!flex !justify-center !gap-3 !px-6 !pb-6 !pt-4">
        <button
          mat-flat-button
          [disabled]="!formData.assignedShotIds || formData.assignedShotIds.length === 0"
          (click)="onApply()"
        >
          {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON' | translate }}
        </button>
        <button mat-stroked-button (click)="onCancel()">
          {{ 'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MassiveMunitionsConfigurationDialog {
  readonly denominationSearchInputRef = viewChild<ElementRef<HTMLInputElement>>('denominationSearchInput');
  readonly #dialogRef = inject(MatDialogRef<MassiveMunitionsConfigurationDialog>);
  readonly #translate = inject(TranslateService);
  public data = inject<MassiveConfigDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly munitionsStore = inject(MunitionsStore);
  readonly seriesAndShotsStore = inject(SeriesAndShotsStore);
  readonly componentTypes = this.munitionsStore.componentTypes;
  readonly munitionTypes = this.munitionsStore.munitionTypes;
  readonly denominationsRaw = this.munitionsStore.denominationsRaw;

  readonly selectedMunitionTypeId = signal<string>('');
  readonly denominationSearchTerm = signal('');

  readonly filteredComponentTypes = computed(() => {
    const components = this.componentTypes();
    return components.filter((c) => c.category === 'MUNITION_COMPONENT');
  });

  readonly filteredDenominations = computed(() => {
    const munitionTypeId = this.selectedMunitionTypeId();
    const allDenominations = this.denominationsRaw();

    // Filter by selected munition type (same logic as configuration-form)
    const byType = munitionTypeId ? allDenominations.filter((d) => d.munitionType?.id === munitionTypeId) : [];

    const term = this.#normalizeText(this.denominationSearchTerm());
    if (!term)
      return byType.map((d) => ({ id: d.id, label: d.name, name: { es: d.name, en: d.name }, active: d.active }));

    return byType
      .filter((d) => this.#normalizeText(d.name).includes(term))
      .map((d) => ({ id: d.id, label: d.name, name: { es: d.name, en: d.name }, active: d.active }));
  });

  readonly filteredComponentDenominations = computed(() => {
    const term = this.#normalizeText(this.denominationSearchTerm());
    const all = this.munitionsStore.denominations();
    if (!term) return all;
    return all.filter((d) => this.#normalizeText(d.label).includes(term));
  });

  #normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  onDenominationSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.denominationSearchTerm.set(target?.value ?? '');
  }

  onMunitionTypeChange(munitionTypeId: string): void {
    this.selectedMunitionTypeId.set(munitionTypeId);
    // Reset denomination when type changes
    this.formData.denomination = '';
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

  readonly allShots = computed(() => {
    return this.seriesAndShotsStore.series()?.flatMap((s) => s.shots) ?? [];
  });

  readonly allShotsSelected = computed(() => {
    const shots = this.allShots();
    const assigned = this.formData.assignedShotIds ?? [];
    return shots.length > 0 && shots.every((s) => assigned.includes(s.id));
  });

  readonly someShotsSelected = computed(() => {
    const shots = this.allShots();
    const assigned = this.formData.assignedShotIds ?? [];
    return assigned.length > 0 && !shots.every((s) => assigned.includes(s.id));
  });

  formData: MassiveConfigFormData = createEmptyMassiveConfigFormData();

  get isConditioningEnabled(): boolean {
    return this.formData.reconditioning !== undefined;
  }

  get assignedShotIdsDisplay(): string {
    return this.formData.assignedShotIds?.join(', ') ?? '';
  }

  constructor() {
    if (this.data?.preloadedData) {
      this.formData = { ...this.formData, ...this.data.preloadedData };
    }

    effect(() => {
      const status = this.munitionsStore.updateMunitionsStatus();
      if (status === 'resolved') {
        this.#dialogRef.close(true);
      }
    });

    effect(() => {
      const shots = this.allShots();
      if (shots.length > 0 && !this.data?.preloadedData?.assignedShotIds && this.formData.assignedShotIds === null) {
        untracked(() => {
          this.formData.assignedShotIds = shots.map((s) => s.id);
        });
      }
    });
  }

  onDecimalKeydown(event: KeyboardEvent): void {
    if (event.key === '.') {
      event.preventDefault();
      try {
        document.execCommand('insertText', false, ',');
      } catch {
        const input = event.target as HTMLInputElement;
        input.value += ',';
        input.dispatchEvent(new Event('input'));
      }
    }
  }

  onComponentDenominationChange(component: string, denomId: string): void {
    const denom = this.munitionsStore.denominations().find((d) => d.id === denomId);
    if (denom) {
      this.getComponentData(component).denomination = {
        id: denom.id,
        name: denom.label,
      };
    }
  }

  onAssignedShotsChange(value: string): void {
    if (!value.trim()) {
      this.formData.assignedShotIds = null;
    } else {
      this.formData.assignedShotIds = value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
  }

  onSelectAllShots(checked: boolean): void {
    const ids = checked ? this.allShots().map((s) => s.id) : [];
    this.formData.assignedShotIds = ids.length > 0 ? ids : null;
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

    this.formData.clientNumber = sanitized;
  }

  onComponentClientNumberInput(component: string, event: Event): void {
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

    this.getComponentData(component).clientNumber = sanitized;
  }

  getClientNumberError(clientNumber: string | number | undefined): string | null {
    const val = String(clientNumber ?? '').trim();
    if (!val || val === '0') return null;

    if (val.endsWith(',')) {
      return 'No puede terminar con coma';
    }

    const numbersCount = val.split(',').filter((x) => x.trim().length > 0).length;
    const limit = this.formData.assignedShotIds?.length ?? 0;

    if (numbersCount > limit) {
      return `No puede haber más números (${numbersCount}) que disparos asociados (${limit})`;
    }

    return null;
  }

  onConditioningToggle(checked: boolean): void {
    this.formData.reconditioning = checked ? createEmptyReconditioning() : undefined;
  }

  onReconditioningFieldChange(field: keyof ReconditioningData, value: number | string): void {
    if (!this.formData.reconditioning) {
      this.formData.reconditioning = createEmptyReconditioning();
    }
    (this.formData.reconditioning as Record<string, number | string | undefined>)[field] = value;
  }

  isComponentConditioningEnabled(component: string): boolean {
    return this.getComponentData(component).reconditioning !== undefined;
  }

  onComponentConditioningToggle(component: string, checked: boolean): void {
    const componentData = this.getComponentData(component);
    componentData.reconditioning = checked ? createEmptyReconditioning() : undefined;
  }

  onComponentReconditioningChange(component: string, field: keyof ReconditioningData, value: number | string): void {
    const componentData = this.getComponentData(component);
    if (!componentData.reconditioning) {
      componentData.reconditioning = createEmptyReconditioning();
    }
    (componentData.reconditioning as Record<string, number | string | undefined>)[field] = value;
  }

  getComponentLabel(componentKey: string): string {
    const labelKey = `TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.COMPONENT_LABELS.${componentKey.toUpperCase()}`;
    const translation = this.#translate.instant(labelKey);
    return translation !== labelKey ? translation : componentKey;
  }

  removeComponent(component: string): void {
    this.formData.selectedComponents = this.formData.selectedComponents.filter((c) => c !== component);
    delete this.formData.componentsData[component];
  }

  getComponentData(component: string): ComponentDetail {
    if (!this.formData.componentsData[component]) {
      const detail = createEmptyComponentDetail(component);
      const typeEntry = this.componentTypes().find((ct) => ct.label.toLowerCase() === component);
      if (typeEntry) {
        detail.type = { id: typeEntry.id, type: typeEntry.label.toLowerCase(), label: typeEntry.label };
      }
      this.formData.componentsData[component] = detail;
    }
    return this.formData.componentsData[component];
  }

  onComponentSubFormChange(component: string, detail: ComponentDetail): void {
    this.formData.componentsData[component] = detail;
  }

  #validateForm(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.formData.denomination) {
      errors.push(
        this.#translate.instant('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.VALIDATION.DENOMINATION_REQUIRED'),
      );
    }

    if (this.formData.reconditioning) {
      if (!this.formData.reconditioning.temperature) {
        errors.push(
          this.#translate.instant('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.VALIDATION.TEMPERATURE_REQUIRED'),
        );
      }
      if (!this.formData.reconditioning.tolerance) {
        errors.push(
          this.#translate.instant('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.VALIDATION.TOLERANCE_REQUIRED'),
        );
      }
      if (!this.formData.reconditioning.timeMin) {
        errors.push(
          this.#translate.instant('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.VALIDATION.MIN_TIME_REQUIRED'),
        );
      }
      if (!this.formData.reconditioning.timeMax) {
        errors.push(
          this.#translate.instant('TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.VALIDATION.MAX_TIME_REQUIRED'),
        );
      }
    }

    if (this.formData.clientNumber) {
      const val = String(this.formData.clientNumber).trim();
      if (val && val !== '0') {
        if (val.endsWith(',')) {
          errors.push('El número de cliente no puede terminar con coma');
        } else {
          const numbersCount = val.split(',').filter((x) => x.trim().length > 0).length;
          const limit = this.formData.assignedShotIds?.length ?? 0;
          if (numbersCount > limit) {
            errors.push(
              `El número de cliente no puede tener más números (${numbersCount}) que disparos asociados (${limit})`,
            );
          }
        }
      }
    }

    if (this.formData.selectedComponents.length > 0) {
      this.formData.selectedComponents.forEach((component) => {
        const componentData = this.formData.componentsData[component];
        if (!componentData?.denomination) {
          errors.push(
            this.#translate.instant(
              'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.VALIDATION.COMPONENT_DENOMINATION_REQUIRED',
              {
                component: this.getComponentLabel(component),
              },
            ),
          );
        }
        if (!componentData?.batch) {
          errors.push(
            this.#translate.instant(
              'TRIAL_PLANNING.MUNITIONS.MASSIVE_CONFIG_DIALOG.VALIDATION.COMPONENT_LOT_REQUIRED',
              {
                component: this.getComponentLabel(component),
              },
            ),
          );
        }
        if (componentData?.clientNumber) {
          const val = String(componentData.clientNumber).trim();
          if (val && val !== '0') {
            if (val.endsWith(',')) {
              errors.push(`El número de cliente de ${this.getComponentLabel(component)} no puede terminar con coma`);
            } else {
              const numbersCount = val.split(',').filter((x) => x.trim().length > 0).length;
              const limit = this.formData.assignedShotIds?.length ?? 0;
              if (numbersCount > limit) {
                errors.push(
                  `El número de cliente de ${this.getComponentLabel(component)} no puede tener más números (${numbersCount}) que disparos asociados (${limit})`,
                );
              }
            }
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  onApply(): void {
    if (this.formData.maxAllowedErrors < 0) {
      this.formData.maxAllowedErrors = 0;
    }
    this.formData.selectedComponents.forEach((component) => {
      const componentData = this.formData.componentsData[component];
      if (componentData && componentData.maxAllowedErrors < 0) {
        componentData.maxAllowedErrors = 0;
      }
    });

    const validation = this.#validateForm();

    if (!validation.valid) {
      console.error('Errores de validación:', validation.errors);
      alert(`Errores de validación:\n${validation.errors.join('\n')}`);
      return;
    }

    this.munitionsStore.updateMunitions(this.#buildRequest());
  }

  onCancel(): void {
    this.#dialogRef.close(null);
  }

  resetForm(): void {
    this.formData = createEmptyMassiveConfigFormData();
  }

  #buildRequest(): MunitionBulkUpdateRequest {
    const series = this.seriesAndShotsStore.series() ?? [];
    const assignedShotIds = this.formData.assignedShotIds ?? [];
    const componentTypes = this.munitionsStore.componentTypes();

    const configurations: MunitionConfigRequest[] = [];

    for (const serie of series) {
      const shotsForSerie = serie.shots.filter((shot) => assignedShotIds.includes(shot.id)).map((shot) => shot.id);

      if (shotsForSerie.length === 0) continue;

      configurations.push({
        seriesId: serie.id,
        denominationId: this.formData.denomination,
        batch: this.formData.batch,
        observations: this.formData.observations,
        reconditioning: this.formData.reconditioning,
        maxAllowedErrors: this.formData.maxAllowedErrors,
        assignedShotIds: shotsForSerie,
        components: this.formData.selectedComponents.map((key) => {
          const comp = this.getComponentData(key);
          const resolvedTypeId =
            componentTypes.find((ct) => ct.id.toLowerCase() === key.toLowerCase())?.id ??
            componentTypes.find((ct) => ct.label.toLowerCase() === key.toLowerCase())?.id ??
            comp.type.id;
          return {
            typeId: resolvedTypeId,
            denominationId: comp.denomination.id || this.formData.denomination,
            batch: comp.batch,
            reconditioning: comp.reconditioning,
            clientNumber: comp.clientNumber,
            observations: comp.observations,
            fuseWorkingModeId: comp.fuseWorkingMode?.id,
            fuseMeasurement: comp.fuseMeasurement,
            maxAllowedErrors: comp.maxAllowedErrors,
          };
        }),
      });
    }

    return { configurations };
  }
}
