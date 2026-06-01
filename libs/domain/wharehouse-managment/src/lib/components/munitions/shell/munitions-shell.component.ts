import type { OnDestroy } from '@angular/core';
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
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { UiDialogService } from '@intaqalab/ui';
import type { UIDialogConfirm } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { WarehouseMunitionCategoryType } from '../../../models/munition-components.model';
import { MunitionsStockService } from '../../../services/munitions-stock.service';
import { getPayloadMunition, getPayloadMunitionComponents } from '../../../utils/munitions-utils';
import { ComponentMunitionComponent } from '../component-munition/component-munition.component';
import { MunitionGeneralDataComponent } from '../general-data/general-data.component';
import { MunitionIdentificationComponent } from '../identification/identification.component';
import { MunitionLocationComponent } from '../location/location.component';

@Component({
  imports: [
    MatButtonModule,
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MunitionGeneralDataComponent,
    MunitionLocationComponent,
    MunitionIdentificationComponent,
    ComponentMunitionComponent,
  ],
  template: `
    <div>
      <h2 class="text-base font-semibold text-gray-900 my-6">
        {{ 'MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITION_NEW' | translate }}
      </h2>
      <h3 class="w-full border-b border-gray-600 pb-1 mb-4 font-semibold text-base">
        {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_IDENTIFICATION' | translate }}
      </h3>
      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 align-center">
          <div class="w-full">
            <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CATEGORY' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <mat-select
                id="category"
                [value]="null"
                [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CATEGORY_PLACEHOLDER' | translate"
                [disabled]="category() !== null"
                (selectionChange)="onCategory($event.value)"
              >
                <mat-option value="MUNITION">
                  {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION' | translate }}
                </mat-option>
                <mat-option value="MUNITION_COMPONENT">
                  {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION_COMPONENT' | translate }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        @if (category() !== null) {
          <inta-munition-identification
            data-testid="identificationForm"
            #identificationForm
          ></inta-munition-identification>

          <inta-general-data #generalDataForm></inta-general-data>

          <inta-munition-location #locationForm></inta-munition-location>

          @if (category() === 'MUNITION') {
            <div class="flex justify-between gap-4 border-b border-gray-600 pb-1 mb-4 items-end">
              <h3 class="font-semibold text-base">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_COMPONENTS' | translate }}
              </h3>
              <button mat-flat-button type="button" class="mb-1" (click)="addComponent()">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ADD_COMPONENT' | translate }}
              </button>
            </div>
            @for (item of items; track item) {
              <inta-component-munition
                data-testid="munitionComponent"
                [enterUbications]="isMunitionComponent()"
                [enterQuantity]="isMunitionComponent()"
              ></inta-component-munition>
              @if (!$last) {
                <div class="w-full border-b border-gray-200 pb-1 my-2 font-semibold text-base"></div>
              }
            }
          }

          <mat-card-actions class="flex justify-end gap-4 mt-6">
            <button mat-flat-button type="button" [disabled]="disabledRegister()" (click)="register()">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SAVE' | translate }}
            </button>
            <button mat-stroked-button type="button" (click)="reset()">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.RESET' | translate }}
            </button>
          </mat-card-actions>
        }
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionsShellComponent implements OnDestroy {
  readonly #munitionComponentStore = inject(MunitionComponentStore);
  readonly #munitionDumpsStore = inject(MunitionsDumpsStore);

  category = signal<WarehouseMunitionCategoryType | null>(null);
  onCategory(categoryId: string) {
    this.category.set(categoryId as WarehouseMunitionCategoryType);

    if (categoryId === 'MUNITION_COMPONENT') {
      this.addComponent();
      this.#munitionComponentStore.search({ category: this.category(), active: true });
    } else {
      this.#munitionComponentStore.search({ pageSize: 500, active: true });
    }
  }

  isMunitionComponent = computed(() => {
    return this.category() === 'MUNITION_COMPONENT';
  });

  #counter = 0;
  items: number[] = [];
  addComponent() {
    this.items.push(++this.#counter);
  }

  readonly #router = inject(Router);
  readonly #uiDialogs = inject(UiDialogService);
  constructor() {
    this.#munitionDumpsStore.search({ pageSize: 500, active: true });

    effect(async () => {
      const saveStatusCode = this.munitionsStockDataService.saveMunitionResource.statusCode();
      if (saveStatusCode === 400) {
        const error = this.munitionsStockDataService.saveMunitionResource.error();
        const detail = error?.message || '';
        let message: UIDialogConfirm;
        if (detail.toLocaleLowerCase().includes('neq')) {
          message = {
            labelButtonConfirm: 'COMMONS.CONFIRM',
            title: 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CONFIRM_NEQ_CONTROL_TITLE',
            htmlText: 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CONFIRM_NEQ_CONTROL_TEXT',
          };
        } else {
          message = {
            labelButtonConfirm: 'COMMONS.CONFIRM',
            title: 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CONFIRM_COMPATIBILITY_TITLE',
            htmlText: 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CONFIRM_COMPATIBILITY_TEXT',
          };
        }
        const ok = await this.#uiDialogs.confirm(message);
        const previousData = untracked(() => this.munitionsStockDataService.munition());
        if (ok && previousData !== null) {
          this.munitionsStockDataService.munition.set({
            itemToSave: previousData.itemToSave,
            force: true,
          });
        }
      }
    });

    effect(async () => {
      const saveMunitionStatus = this.munitionsStockDataService.saveMunitionResource.status();
      if (saveMunitionStatus === 'resolved') {
        const id = this.munitionsStockDataService.saveMunitionResource.value()?.id;
        this.#router.navigateByUrl('/wharehouse-managment/stock/munitions/' + id);
      }
      const saveComponentsStatus = this.munitionsStockDataService.saveMunitionComponentsResource.status();
      if (saveComponentsStatus === 'resolved') {
        this.#router.navigateByUrl('/wharehouse-managment/stock');
      }
    });
  }

  locationComponent = viewChild<MunitionLocationComponent>('locationForm');
  locationValue = computed(() => this.locationComponent()?.value() || undefined);
  locationErrors = computed(() => this.locationComponent()?.errors() || false);

  identificationComponent = viewChild<MunitionIdentificationComponent>('identificationForm');
  identificationValue = computed(() => this.identificationComponent()?.value() || undefined);
  identificationErrors = computed(() => this.identificationComponent()?.errors() || false);

  generalDataComponent = viewChild<MunitionGeneralDataComponent>('generalDataForm');
  generalDataValue = computed(() => this.generalDataComponent()?.value() || undefined);
  generalDataErrors = computed(() => this.generalDataComponent()?.errors() || false);

  components = viewChildren(ComponentMunitionComponent);
  componentsValue = computed(() => {
    const result = [];
    for (const component of this.components()) {
      result.push(component.value());
    }
    return result;
  });

  disabledRegister = computed(() => {
    return this.category() === null;
  });

  hasErrors() {
    const category = this.category();
    if (category === null) {
      return true;
    } else if (category === 'MUNITION') {
      const errors = [this.locationErrors(), this.identificationErrors(), this.generalDataErrors()];
      const someError = errors.some((e) => e);
      return someError;
    } else {
      const values = this.componentsValue();
      const someEmptyLocation = values.some((e) => e.munitionDumpId === '' || e.cellName === '');
      const requiredSections = [this.identificationErrors(), this.generalDataErrors()];
      if (someEmptyLocation) {
        requiredSections.push(this.locationErrors());
      }
      const someError = requiredSections.some((e) => e);
      return someError;
    }
  }

  register() {
    this.identificationComponent()?.markAsTouched();
    this.generalDataComponent()?.markAsTouched();
    this.locationComponent()?.markAsTouched();
    for (const comp of this.components()) {
      comp.markAsTouched();
    }

    if (this.hasErrors()) {
      return;
    }
    const category = this.category();
    if (category === 'MUNITION') {
      this.#registerMunitionStock();
    } else if (category === 'MUNITION_COMPONENT') {
      this.#registerMunitionComponentsStock();
    }
  }

  readonly munitionsStockDataService = inject(MunitionsStockService);
  #registerMunitionStock() {
    const payload = getPayloadMunition(
      this.locationValue(),
      this.identificationValue(),
      this.generalDataValue(),
      this.componentsValue(),
    );
    if (payload !== undefined) {
      this.munitionsStockDataService.munition.set({ itemToSave: payload });
    }
  }

  #registerMunitionComponentsStock() {
    const payload = getPayloadMunitionComponents(this.locationValue(), this.generalDataValue(), this.componentsValue());
    if (payload !== undefined) {
      this.munitionsStockDataService.munitionComponents.set(payload);
    }
  }

  reset() {
    this.generalDataComponent()?.reset();
    this.locationComponent()?.reset();
    this.identificationComponent()?.reset();
    this.components()[0]?.reset();
    this.items = [0];
  }

  ngOnDestroy(): void {
    this.category.set(null);
    this.munitionsStockDataService.clear();
  }
}
