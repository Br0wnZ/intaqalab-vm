import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormField, applyEach, disabled, form, max, min, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { TrialsDataService } from '@intaqalab/data-access';
import type { UIDialogConfirm } from '@intaqalab/ui';
import { IntaSignalSelectComponent, UiDialogService } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionIdentificationForm, MunitionStockFormModel } from '../../../models/munition-stock.model';
import { WarehouseMunitionCategory } from '../../../models/utils.model';
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
    IntaSignalSelectComponent,
    MatCardModule,
    MunitionGeneralDataComponent,
    MunitionLocationComponent,
    MunitionIdentificationComponent,
    ComponentMunitionComponent,
    FormField,
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
        <div class="w-full">
          <ui-inta-signal-select
            appearance="outline"
            [id]="'category'"
            [valueKey]="'id'"
            [labelKey]="'label'"
            [formField]="form.category"
            [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CATEGORY' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CATEGORY_PLACEHOLDER' | translate"
            [options]="categoryOptions"
          />
          @if (formModel().category) {
            @if (formModel().category === 'MUNITION_COMPONENT') {
              <div class="flex justify-between gap-4 border-b border-gray-600 pb-1 mb-4 mt-4 items-end">
                <h3 class="font-semibold text-base">
                  {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_COMPONENTS' | translate }}
                </h3>
                <button mat-flat-button type="button" class="mb-1" (click)="addMultipleComponentData()">
                  {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ADD_COMPONENT' | translate }}
                </button>
              </div>
              @for (component of form.multipleComponentsData; track $index) {
                <inta-component-munition data-testid="munitionComponent" [form]="component"></inta-component-munition>
                @if (!$last) {
                  <div class="w-full border-b border-gray-200 pb-1 my-2 font-semibold text-base"></div>
                }
              }
            } @else if (formModel().category === 'MUNITION') {
              <inta-munition-identification
                data-testid="identificationForm"
                [category]="formModel().category"
                [form]="form"
              ></inta-munition-identification>
            }

            <inta-general-data [form]="form" [associatedTrials]="associatedTrials()" />

            <inta-munition-location [form]="form"></inta-munition-location>

            @if (formModel().category === 'MUNITION') {
              <div class="flex justify-between gap-4 border-b border-gray-600 pb-1 mb-4 items-end">
                <h3 class="font-semibold text-base">
                  {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_COMPONENTS' | translate }}
                </h3>
                <button mat-flat-button type="button" class="mb-1" (click)="addAssociatedComponents()">
                  {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ADD_COMPONENT' | translate }}
                </button>
              </div>
              @for (component of form.associatedComponents; track $index) {
                <inta-component-munition
                  data-testid="munitionComponent"
                  [form]="component"
                  [hasQuantity]="false"
                ></inta-component-munition>
                @if (!$last) {
                  <div class="w-full border-b border-gray-200 pb-1 my-2 font-semibold text-base"></div>
                }
              }
            }

            <mat-card-actions class="flex justify-end gap-4 mt-6">
              <button mat-flat-button type="button" [disabled]="form().invalid()" (click)="register()">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SAVE' | translate }}
              </button>
              <button mat-stroked-button type="button" (click)="reset()">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.RESET' | translate }}
              </button>
            </mat-card-actions>
          }
        </div>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionsShellComponent {
  readonly #router = inject(Router);
  readonly #uiDialogs = inject(UiDialogService);
  readonly #munitionComponentStore = inject(MunitionComponentStore);
  readonly #munitionDumpsStore = inject(MunitionsDumpsStore);
  readonly #trialsDataService = inject(TrialsDataService);
  readonly #denominationStore = inject(DenominationsStore);
  readonly #translate = inject(TranslateService);

  readonly categoryOptions = [
    {
      id: WarehouseMunitionCategory.MUNITION,
      label: this.#translate.instant('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION'),
    },
    {
      id: WarehouseMunitionCategory.MUNITION_COMPONENT,
      label: this.#translate.instant('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION_COMPONENT'),
    },
  ];

  isMunitionComponent = computed(() => {
    const category = this.formModel().category;

    return category === 'MUNITION_COMPONENT';
  });

  readonly associatedTrials = computed(() => {
    const response = this.#trialsDataService.source.value();

    if (!response) return [];

    return response.items.map((e) => {
      return {
        id: e.id,
        label: `${e.trialNumber} - ${e.description || ''}`,
      };
    });
  });

  readonly associatedComponents = computed(() => {
    const associatedComponents = this.formModel().associatedComponents;

    if (!associatedComponents) return [];

    return associatedComponents;
  });

  readonly multipleComponentsData = computed(() => {
    const multipleComponentsData = this.formModel().multipleComponentsData;

    if (!multipleComponentsData) return [];

    return multipleComponentsData;
  });

  constructor() {
    this.#munitionDumpsStore.search({ pageSize: 500, active: true });

    effect(() => {
      const category = this.form.category().value();

      if (!category) return;

      let params: Record<string, unknown> = { pageSize: 500, active: true };

      if (category === WarehouseMunitionCategory.MUNITION_COMPONENT)
        params = { ...params, category: WarehouseMunitionCategory.MUNITION_COMPONENT };

      this.#munitionComponentStore.search(params);
    });

    effect(() => {
      const munitionTypeId = this.form.munitionTypeId().value();

      if (!munitionTypeId) return;

      untracked(() => {
        this.formModel.update((current) => {
          return {
            ...current,
            denominationId: this.#defaultFormModel.denominationId,
          };
        });
      });

      this.#denominationStore.search({
        munitionTypeId,
        pageSize: 500,
        active: true,
      });
    });

    // effect(() => {
    //   const multipleComponentsData = this.form.multipleComponentsData().value();

    //   if (!multipleComponentsData.length) return;

    //   multipleComponentsData.forEach((component, index) => {
    //     const munitionTypeId = component.munitionTypeId;
    //     console.log(munitionTypeId)
    //     console.log(this.formModel().multipleComponentsData[index])

    //   })

    //   untracked(() => {
    //     this.formModel.update((current) => {
    //       return {
    //         ...current,
    //         denominationId: this.#defaultFormModel.denominationId,
    //       };
    //     });
    //   });

    //   // this.#denominationStore.search({
    //   //   munitionTypeId,
    //   //   pageSize: 500,
    //   //   active: true,
    //   // });
    // });

    effect(() => {
      const munitionDumpId = this.form.location.munitionDumpId().value();

      if (!munitionDumpId) return;

      untracked(() => {
        this.formModel.update((current) => {
          return {
            ...current,
            location: {
              munitionDumpId: current.location.munitionDumpId,
              cellName: this.#defaultFormModel.location.cellName,
            },
          };
        });
      });
    });

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
        this.munitionsStockDataService.munition.set(null);
        this.#router.navigateByUrl('/wharehouse-managment/stock/munitions/' + id);
      }
      const saveComponentsStatus = this.munitionsStockDataService.saveMunitionComponentsResource.status();
      if (saveComponentsStatus === 'resolved') {
        this.munitionsStockDataService.munitionComponents.set(null);
        this.#router.navigateByUrl('/wharehouse-managment/stock');
      }
    });
  }

  #defaultFormModel = {
    category: null,
    munitionTypeId: '',
    denominationId: '',
    batch: '',
    quantity: null,
    generalData: {
      clientId: '',
      entryDate: new Date().toISOString(),
      plannedFireTrialId: '',
      observations: '',
    },
    location: {
      munitionDumpId: '',
      cellName: '',
    },
    associatedComponents: [],
    multipleComponentsData: [
      {
        munitionTypeId: '',
        denominationId: '',
        batch: '',
        quantity: null,
      },
    ],
  };

  formModel = signal<MunitionStockFormModel>(this.#defaultFormModel);

  form = form(this.formModel, (schemaPath) => {
    disabled(schemaPath.category, () => !!this.formModel().category);

    required(schemaPath.munitionTypeId, {
      when: () => {
        return this.formModel().category === WarehouseMunitionCategory.MUNITION;
      },
    });
    required(schemaPath.denominationId, {
      when: () => {
        return this.formModel().category === WarehouseMunitionCategory.MUNITION;
      },
    });
    required(schemaPath.batch, {
      when: () => {
        return this.formModel().category === WarehouseMunitionCategory.MUNITION;
      },
    });
    required(schemaPath.quantity, {
      when: () => {
        return this.formModel().category === WarehouseMunitionCategory.MUNITION;
      },
    });
    min(schemaPath.quantity, 0);
    max(schemaPath.quantity, 999999);
    validate(schemaPath.quantity, ({ value }) => {
      const quantity = value();

      if (quantity !== null && +quantity <= 0) {
        return { kind: 'greater_than_zero', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
      }

      return null;
    });

    required(schemaPath.generalData.clientId);
    required(schemaPath.generalData.entryDate);
    validate(schemaPath.generalData.clientId, ({ value }) => {
      const client = value();
      const associatedTrials = this.associatedTrials();
      const plannedTrialId = this.formModel().generalData.plannedFireTrialId;

      if (client && !associatedTrials.length && !plannedTrialId)
        return { kind: 'emptyList', message: 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_NO_TRIAL_ERROR' };

      if (!client && this.form.generalData.clientId().touched())
        return { kind: 'required', message: 'COMMONS.REQUIRED_FIELD' };

      return null;
    });
    disabled(
      schemaPath.generalData.plannedFireTrialId,
      () =>
        !!this.form.generalData
          .clientId()
          .errors()
          .find((e) => e.kind === 'emptyList'),
    );

    required(schemaPath.location.munitionDumpId);
    required(schemaPath.location.cellName);

    applyEach(schemaPath.multipleComponentsData, (component) => {
      required(component.munitionTypeId, {
        when: () => {
          return this.formModel().category === WarehouseMunitionCategory.MUNITION_COMPONENT;
        },
      });
      required(component.denominationId, {
        when: () => {
          return this.formModel().category === WarehouseMunitionCategory.MUNITION_COMPONENT;
        },
      });
      required(component.batch, {
        when: () => {
          return this.formModel().category === WarehouseMunitionCategory.MUNITION_COMPONENT;
        },
      });
      required(component.quantity!, {
        when: () => {
          return this.formModel().category === WarehouseMunitionCategory.MUNITION_COMPONENT;
        },
      });
      min(component.quantity!, 0);
      max(component.quantity!, 999999);
      validate(component.quantity!, ({ value }) => {
        const quantity = value();
        const isMunitionComponent = this.formModel().category === WarehouseMunitionCategory.MUNITION_COMPONENT;

        if (isMunitionComponent && quantity !== null && +quantity <= 0) {
          return { kind: 'greater_than_zero', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
        }

        return null;
      });
    });

    applyEach(schemaPath.associatedComponents, (component) => {
      required(component.munitionTypeId, {
        when: () => {
          return this.formModel().category === WarehouseMunitionCategory.MUNITION;
        },
      });
      required(component.denominationId, {
        when: () => {
          return this.formModel().category === WarehouseMunitionCategory.MUNITION;
        },
      });
      required(component.batch, {
        when: () => {
          return this.formModel().category === WarehouseMunitionCategory.MUNITION;
        },
      });
    });
  });

  register() {
    const category = this.formModel().category;

    if (!category) return;

    const callbacks = {
      MUNITION: () => this.#registerMunitionStock(),
      MUNITION_COMPONENT: () => this.#registerMunitionComponentsStock(),
    };

    callbacks[category]();
  }

  readonly munitionsStockDataService = inject(MunitionsStockService);
  #registerMunitionStock() {
    const form = this.formModel();
    const payload = getPayloadMunition(form);

    if (payload) {
      this.munitionsStockDataService.munition.set({ itemToSave: payload });
    }
  }

  #registerMunitionComponentsStock() {
    const form = this.formModel();
    const payload = getPayloadMunitionComponents(form);

    if (payload.length) {
      this.munitionsStockDataService.munitionComponents.set(payload);
    }
  }

  addAssociatedComponents() {
    const defaultItemToPushModel = signal<MunitionIdentificationForm>({
      munitionTypeId: '',
      denominationId: '',
      batch: '',
    });

    this.formModel.update((current) => {
      return {
        ...current,
        associatedComponents: [...current.associatedComponents, defaultItemToPushModel()],
      };
    });
  }

  addMultipleComponentData() {
    const defaultItemToPushModel = signal<MunitionIdentificationForm>({
      munitionTypeId: '',
      denominationId: '',
      batch: '',
      quantity: null,
    });

    this.formModel.update((current) => {
      return {
        ...current,
        multipleComponentsData: [...current.multipleComponentsData, defaultItemToPushModel()],
      };
    });
  }

  reset() {
    this.formModel.set(this.#defaultFormModel);
  }
}
