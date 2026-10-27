import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormField, disabled, form, min } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { type PlanningConditionsShot, PlanningLoadingZonesService } from '@intaqalab/data-access-planning';
import { InputSelect } from '@intaqalab/ui';
import { createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore, type MunitionIntroIdentificationState } from '../../../../+state/execution.store';
import {
  type ShotMunitionComponentOption,
  injectComponentDenominations,
  injectDenominationBatches,
} from '../../../../data-access';
import type { IdentFormModel, InputFieldValue } from '../munition-introduction';

@Component({
  selector: 'inta-munition-identificacion-tab',
  imports: [FormField, MatFormFieldModule, MatSelectModule, MatInputModule, TranslateModule, InputSelect],
  template: `
    <div class="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-4 min-h-0 content-start">
      <!-- Componente -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_PLACEHOLDER' | translate"
          [formField]="identForm.componente"
          (selectionChange)="onComponentChange($event.value)"
        >
          @for (opt of componenteOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Denominación -->
      <mat-form-field
        appearance="outline"
        subscriptSizing="dynamic"
        class="w-full"
        [class.border-red-300]="denominacionError()"
      >
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DENOMINACION_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DENOMINACION_PLACEHOLDER' | translate"
          [formField]="identForm.denominacion"
          (selectionChange)="onDenominacionChange($event.value)"
        >
          @for (opt of filteredDenominacionOptions(); track opt.value) {
            <mat-option [value]="opt.value" [class.text-red-500]="!opt.inStock">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Lote -->
      <mat-form-field
        appearance="outline"
        subscriptSizing="dynamic"
        class="w-full"
        [class.border-red-300]="loteError()"
      >
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.LOTE_LABEL' | translate }}</mat-label>
        <mat-select
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.LOTE_PLACEHOLDER' | translate"
          [formField]="identForm.lote"
        >
          @for (opt of filteredLoteOptions(); track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Observaciones -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
        <textarea
          matInput
          rows="4"
          class="!resize-none"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
          [value]="observacionesField() ?? ''"
          (input)="observacionesField.set($any($event.target).value || null)"
        ></textarea>
      </mat-form-field>

      <!-- Nº Cliente -->
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
        <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.NUMERO_CLIENTE_LABEL' | translate }}</mat-label>
        <input
          matInput
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.NUMERO_CLIENTE_PLACEHOLDER' | translate"
          [value]="numeroClienteField() ?? ''"
          (input)="numeroClienteField.set($any($event.target).value || null)"
        />
      </mat-form-field>

      <!-- Modo funcionamiento espoleta -->
      @if (isEspoleta()) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_LABEL' | translate }}
          </mat-label>
          <mat-select
            id="modo-funcionamiento"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_PLACEHOLDER' | translate"
            [formField]="identForm.modoFuncionamiento"
          >
            @for (opt of modoFuncionamientoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Graduación espoleta -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.GRADUACION_ESPOLETA_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.GRADUACION_ESPOLETA_PLACEHOLDER' | translate"
          [value]="graduacionEspoletaField()"
          [readOnly]="isGraduacionEspoletaDisabled()"
          [variant]="isGraduacionEspoletaDisabled() ? 'computed' : 'default'"
          (valueChange)="graduacionEspoletaField.set($event)"
        />
      }

      <!-- Zona/Módulos carga de proyección -->
      @if (isCargaDeProyeccion()) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.ZONA_MODULOS_LABEL' | translate }}
          </mat-label>
          <mat-select
            id="zona-modulos"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.ZONA_MODULOS_PLACEHOLDER' | translate"
            [formField]="identForm.loadingZone"
          >
            @for (zone of filteredZonaModulosOptions(); track zone) {
              <mat-option [value]="zone">{{ zone }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <!-- Cantidad suplemento -->
      @if (isSuplemento()) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.CANTIDAD_LABEL' | translate }}
          </mat-label>
          <input
            id="suplemento-cantidad"
            matInput
            type="number"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.CANTIDAD_PLACEHOLDER' | translate"
            [formField]="identForm.cantidad"
          />
        </mat-form-field>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionIdentificacionTabComponent {
  readonly #store = inject(ExecutionStore);
  readonly #loadingZonesService = inject(PlanningLoadingZonesService);

  readonly componenteOptions = input<ShotMunitionComponentOption[]>([]);
  readonly modoFuncionamientoOptions = input<Array<{ value: string; label: string }>>([]);
  readonly shotConditions = input<PlanningConditionsShot | null>(null);
  readonly componentChange = output<string>();
  readonly denominationChange = output<string>();

  readonly identFormModel = signal<IdentFormModel>({
    componente: this.#store.munitionIntroduction().identificacion.componente,
    denominacion: this.#store.munitionIntroduction().identificacion.denominacion,
    lote: this.#store.munitionIntroduction().identificacion.lote,
    modoFuncionamiento: this.#store.munitionIntroduction().identificacion.modoFuncionamiento,
    loadingZone: this.#store.munitionIntroduction().identificacion.loadingZone,
    cantidad: this.#store.munitionIntroduction().identificacion.cantidad,
  });
  readonly identForm = form(this.identFormModel, (f) => {
    disabled(f.modoFuncionamiento, () => this.isModoFuncionamientoDisabled());
    disabled(f.loadingZone, () => !this.identFormModel().denominacion);
    disabled(f.cantidad, () => this.isCantidadDisabled());
    min(f.cantidad, 0);
  });

  readonly observacionesField = signal<string | null>(this.#store.munitionIntroduction().identificacion.observaciones);
  readonly numeroClienteField = signal<string | null>(this.#store.munitionIntroduction().identificacion.numeroCliente);

  #numToField(value: number | null, unit: string): InputFieldValue {
    return value !== null ? { value: value.toString(), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field) return null;
    const n = parseFloat(field.value);
    return isNaN(n) ? null : n;
  }

  readonly graduacionEspoletaField = signal<InputFieldValue>(
    this.#numToField(this.#store.munitionIntroduction().identificacion.graduacionEspoleta, 's'),
  );

  // ── Dirty por valor: revertir un campo a su valor guardado vuelve a limpiar el formulario ──
  readonly #dirtyTracker = createDirtyTracker(() => ({
    componente: this.identFormModel().componente,
    denominacion: this.identFormModel().denominacion,
    lote: this.identFormModel().lote,
    modoFuncionamiento: this.identFormModel().modoFuncionamiento,
    loadingZone: this.identFormModel().loadingZone,
    cantidad: this.identFormModel().cantidad,
    observaciones: this.observacionesField(),
    numeroCliente: this.numeroClienteField(),
    graduacionEspoleta: this.graduacionEspoletaField(),
  }));

  readonly isDirty = this.#dirtyTracker.isDirty;

  readonly isValid = computed(() => this.identForm().valid());

  readonly secondsOptions = [{ value: 's', label: 's' }];

  readonly selectedComponent = computed(() => {
    const compId = this.identFormModel().componente;
    return this.componenteOptions().find((c) => c.value === compId);
  });

  readonly #denominationsHandle = injectComponentDenominations({
    munitionTypeId: computed(() => this.identFormModel().componente),
    planned: computed(() => this.selectedComponent()?.planned ?? null),
  });

  readonly #batchesHandle = injectDenominationBatches({
    denominationId: computed(() => this.identFormModel().denominacion),
    plannedBatch: computed(() => this.selectedComponent()?.planned.batch ?? null),
  });

  readonly filteredDenominacionOptions = computed(() => {
    const warehouseOptions = this.#denominationsHandle.options();
    const currentDenomination = this.identFormModel().denominacion;
    const componente = this.identFormModel().componente;
    const storedIdentification = this.#store.munitionIntroduction().identificacion;

    if (
      componente &&
      currentDenomination &&
      storedIdentification.componente === componente &&
      storedIdentification.denominacion === currentDenomination &&
      !warehouseOptions.some((d) => d.value === currentDenomination)
    ) {
      return [
        ...warehouseOptions,
        {
          value: currentDenomination,
          label: currentDenomination,
          munitionTypeId: componente,
          inStock: true,
          planned: false,
        },
      ];
    }

    return warehouseOptions;
  });

  readonly filteredLoteOptions = computed(() => {
    const warehouseBatches = this.#batchesHandle.options();
    const currentLote = this.identFormModel().lote;
    const denominacion = this.identFormModel().denominacion;

    if (currentLote && !warehouseBatches.some((l) => l.value === currentLote)) {
      return [
        ...warehouseBatches,
        {
          value: currentLote,
          label: currentLote,
          denominationId: denominacion ?? '',
          quantity: 0,
          inStock: true,
          planned: false,
        },
      ];
    }

    return warehouseBatches;
  });

  readonly selectedDenominationOption = computed(() => {
    const den = this.identFormModel().denominacion;
    return this.filteredDenominacionOptions().find((d) => d.value === den);
  });

  readonly denominacionError = computed(() => {
    const opt = this.selectedDenominationOption();
    return opt ? !opt.inStock : false;
  });

  readonly selectedLoteOption = computed(() => {
    const lot = this.identFormModel().lote;
    return this.filteredLoteOptions().find((l) => l.value === lot);
  });

  readonly loteError = computed(() => {
    const opt = this.selectedLoteOption();
    return opt ? !opt.inStock : false;
  });

  #checkIsProyectil(compId: string | null): boolean {
    if (!compId) return false;

    const comp =
      this.componenteOptions().find((c) => c.value === compId) ??
      this.#store.munitionIntroduction().componenteOptions.find((c) => c.value === compId);

    const category = (comp?.category ?? '').toLowerCase();
    const label = (comp?.label ?? '').toLowerCase();
    const idLower = compId.toLowerCase();

    return (
      category === 'granada' ||
      category === 'proyectil' ||
      category === 'projectile' ||
      label.includes('proyectil') ||
      label.includes('granada') ||
      label.includes('projectile') ||
      idLower.includes('proyectil') ||
      idLower.includes('granada')
    );
  }

  readonly isProyectil = computed(() => this.#checkIsProyectil(this.identFormModel().componente));

  #checkIsCargaDeProyeccion(compId: string | null): boolean {
    if (!compId) return false;
    if (this.#checkIsSuplemento(compId)) return false;

    const comp =
      this.componenteOptions().find((c) => c.value === compId) ??
      this.#store.munitionIntroduction().componenteOptions.find((c) => c.value === compId);

    const category = (comp?.category ?? '').toLowerCase();
    const label = (comp?.label ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const idLower = compId
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return (
      category === 'carga' ||
      label.includes('carga de proyeccion') ||
      label.includes('propelling charge') ||
      label.includes('propellant charge') ||
      idLower.includes('carga') ||
      idLower.includes('charge')
    );
  }

  readonly isCargaDeProyeccion = computed(() => this.#checkIsCargaDeProyeccion(this.identFormModel().componente));

  #checkIsSuplemento(compId: string | null): boolean {
    if (!compId) return false;

    const compFromInput = this.componenteOptions().find((c) => c.value === compId);
    const compFromStore = this.#store.munitionIntroduction().componenteOptions.find((c) => c.value === compId);
    const comp = compFromInput ?? compFromStore;

    const category = (comp?.category ?? '').toLowerCase();
    const label = (comp?.label ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const idLower = compId
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return (
      category === 'suplemento' ||
      category === 'supplement' ||
      label.includes('suplemento') ||
      label.includes('supplement') ||
      idLower.includes('suplemento') ||
      idLower.includes('supplement')
    );
  }

  readonly isSuplemento = computed(() => this.#checkIsSuplemento(this.identFormModel().componente));

  readonly zonaModulosOptions = computed<string[]>(() => {
    if (!this.isCargaDeProyeccion()) return [];

    const selectedComp = this.selectedComponent();
    const plannedZones = selectedComp?.planned.loadingZones ?? [];

    if (plannedZones.length > 0) {
      return plannedZones;
    }

    const denomId = this.identFormModel().denominacion;
    if (!denomId) return [];

    const resource = this.#loadingZonesService.loadingZonesResource;
    const items = resource.value() ?? [];
    const matched = items.filter((item) => item.denomination?.id === denomId || item.denominationId === denomId);
    const zones = matched.flatMap((item) => item.zone ?? []);
    return Array.from(new Set(zones));
  });

  readonly filteredZonaModulosOptions = computed<string[]>(() => {
    const opts = this.zonaModulosOptions();
    const current = this.identFormModel().loadingZone;
    if (current && !opts.includes(current)) {
      return [current, ...opts];
    }
    return opts;
  });

  #checkIsEspoleta(compId: string | null): boolean {
    if (!compId) return false;

    if (this.#checkIsProyectil(compId) || this.#checkIsCargaDeProyeccion(compId)) {
      return false;
    }

    const compFromInput = this.componenteOptions().find((c) => c.value === compId);
    const compFromStore = this.#store.munitionIntroduction().componenteOptions.find((c) => c.value === compId);
    const comp = compFromInput ?? compFromStore;

    const category = (comp?.category ?? '').toLowerCase();
    const label = (comp?.label ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const idLower = compId
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      category === 'polvo' ||
      category === 'powder' ||
      label.includes('polvora') ||
      label.includes('powder') ||
      label.includes('suplemento')
    ) {
      return false;
    }

    return (
      category === 'espoleta' ||
      label.includes('espoleta') ||
      label.includes('fuze') ||
      label.includes('fuse') ||
      idLower.includes('espoleta') ||
      idLower.includes('fuze') ||
      idLower.includes('fuse') ||
      compFromInput?.isFuse === true ||
      compFromStore?.isFuse === true
    );
  }

  readonly isEspoleta = computed(() => this.#checkIsEspoleta(this.identFormModel().componente));

  readonly plannedModoFuncionamiento = computed<string | null>(() => {
    if (!this.isEspoleta()) return null;
    return this.selectedComponent()?.planned.fuseWorkingModeId ?? this.shotConditions()?.fuseWorkingModeId ?? null;
  });

  readonly plannedGraduacionEspoleta = computed<number | null>(() => {
    if (!this.isEspoleta()) return null;
    return (
      this.selectedComponent()?.planned.fuseMeasurement ??
      this.shotConditions()?.fuseGraduation ??
      this.shotConditions()?.fuseMeasurement ??
      null
    );
  });

  readonly isModoFuncionamientoDisabled = computed<boolean>(() => {
    return this.plannedModoFuncionamiento() !== null && this.plannedModoFuncionamiento() !== undefined;
  });

  readonly isGraduacionEspoletaDisabled = computed<boolean>(() => {
    return this.plannedGraduacionEspoleta() !== null && this.plannedGraduacionEspoleta() !== undefined;
  });

  readonly plannedQuantity = computed<number | null>(() => {
    if (!this.isSuplemento()) return null;
    return this.selectedComponent()?.planned.quantity ?? null;
  });

  readonly isCantidadDisabled = computed<boolean>(() => {
    return this.plannedQuantity() !== null && this.plannedQuantity() !== undefined;
  });

  constructor() {
    this.#loadingZonesService.load();

    // Cascada: si el componente es suplemento y planning define cantidad, sincronizarla
    effect(() => {
      if (this.isSuplemento()) {
        const plannedQty = this.plannedQuantity();
        untracked(() => {
          if (plannedQty !== null && plannedQty !== undefined) {
            this.identFormModel.update((m) => ({ ...m, cantidad: plannedQty }));
          }
        });
      }
    });

    // Cascada: si el componente no es suplemento, limpia cantidad
    effect(() => {
      if (!this.isSuplemento()) {
        untracked(() => {
          if (this.identFormModel().cantidad !== null) {
            this.identFormModel.update((m) => ({ ...m, cantidad: null }));
          }
        });
      }
    });

    // Cascada: si el componente es espoleta y planning define modo o graduación, sincronizarlos
    effect(() => {
      if (this.isEspoleta()) {
        const plannedMode = this.plannedModoFuncionamiento();
        const plannedGrad = this.plannedGraduacionEspoleta();
        untracked(() => {
          if (plannedMode !== null && plannedMode !== undefined) {
            this.identFormModel.update((m) => ({ ...m, modoFuncionamiento: plannedMode }));
          }
          if (plannedGrad !== null && plannedGrad !== undefined) {
            this.graduacionEspoletaField.set(this.#numToField(plannedGrad, 's'));
          }
        });
      }
    });

    // Cascada: si el componente no es espoleta, limpia modoFuncionamiento y graduacionEspoleta
    effect(() => {
      if (!this.isEspoleta()) {
        untracked(() => {
          if (this.identFormModel().modoFuncionamiento !== null) {
            this.identFormModel.update((m) => ({ ...m, modoFuncionamiento: null }));
          }
          if (this.graduacionEspoletaField() !== null) {
            this.graduacionEspoletaField.set(null);
          }
        });
      }
    });

    // Cascada: si el componente no es carga de proyección, limpia loadingZone
    effect(() => {
      if (!this.isCargaDeProyeccion()) {
        untracked(() => {
          if (this.identFormModel().loadingZone !== null) {
            this.identFormModel.update((m) => ({ ...m, loadingZone: null }));
          }
        });
      }
    });

    // Cascada: si es carga de proyección y no hay zona seleccionada, sincronizar con la planificada
    effect(() => {
      if (this.isCargaDeProyeccion()) {
        const plannedZone = this.selectedComponent()?.planned.loadingZoneValue;
        const currentZone = this.identFormModel().loadingZone;
        if (!currentZone && plannedZone) {
          untracked(() => this.identFormModel.update((m) => ({ ...m, loadingZone: plannedZone })));
        }
      }
    });

    // Cascada: si la denominación cambia y la zona actual ya no es válida en las opciones disponibles
    effect(() => {
      if (this.isCargaDeProyeccion()) {
        const opts = this.zonaModulosOptions();
        const currentZone = this.identFormModel().loadingZone;
        if (currentZone && opts.length > 0 && !opts.includes(currentZone)) {
          untracked(() => this.identFormModel.update((m) => ({ ...m, loadingZone: null })));
        }
      }
    });

    // Cascada: si el componente cambia y la denominación actual no es válida, la limpia
    effect(() => {
      const denOpts = this.filteredDenominacionOptions();
      const currentDen = this.identFormModel().denominacion;
      if (currentDen && !denOpts.some((d) => d.value === currentDen)) {
        untracked(() => this.identFormModel.update((m) => ({ ...m, denominacion: null, lote: null })));
      }
    });

    // Cascada: si la denominación cambia y el lote actual no es válido, lo limpia o auto-llena si solo hay 1
    effect(() => {
      const opts = this.filteredLoteOptions();
      const currentLote = this.identFormModel().lote;
      if (currentLote && !opts.some((l) => l.value === currentLote)) {
        untracked(() => this.identFormModel.update((m) => ({ ...m, lote: opts.length === 1 ? opts[0].value : null })));
      }
    });
  }

  getFormUpdates(): Partial<MunitionIntroIdentificationState> {
    const { componente, denominacion, lote, modoFuncionamiento, loadingZone, cantidad } = this.identFormModel();
    const isEspoleta = this.isEspoleta();
    const isCarga = this.isCargaDeProyeccion();
    const isSuplemento = this.isSuplemento();
    const plannedMode = this.plannedModoFuncionamiento();
    const plannedGrad = this.plannedGraduacionEspoleta();
    const plannedQty = this.plannedQuantity();
    return {
      componente,
      denominacion,
      lote,
      modoFuncionamiento: isEspoleta ? (plannedMode ?? modoFuncionamiento) : null,
      numeroCliente: this.numeroClienteField(),
      observaciones: this.observacionesField(),
      graduacionEspoleta: isEspoleta ? (plannedGrad ?? this.#parseNum(this.graduacionEspoletaField())) : null,
      loadingZone: isCarga ? (loadingZone ?? null) : null,
      cantidad: isSuplemento ? (plannedQty ?? cantidad ?? null) : null,
    };
  }

  onDenominacionChange(denominacionId: string | null): void {
    if (!denominacionId) return;
    const option = this.filteredDenominacionOptions().find((d) => d.value === denominacionId);
    this.identFormModel.update((m) => ({
      ...m,
      lote: option?.batch || null,
      loadingZone: null,
    }));
    if (option?.clientNumber !== undefined && option?.clientNumber !== null) {
      this.numeroClienteField.set(option.clientNumber || null);
    }
    this.denominationChange.emit(denominacionId);
  }

  onComponentChange(componente: string | null): void {
    if (componente) {
      this.componentChange.emit(componente);
    }
  }

  applyData(data: Partial<MunitionIntroIdentificationState>): void {
    const targetCompId = data.componente !== undefined ? data.componente : this.identFormModel().componente;
    const isEspoleta = this.#checkIsEspoleta(targetCompId);
    const isCarga = this.#checkIsCargaDeProyeccion(targetCompId);
    const isSuplemento = this.#checkIsSuplemento(targetCompId);
    const plannedMode = this.plannedModoFuncionamiento();
    const plannedGrad = this.plannedGraduacionEspoleta();
    const plannedQty = this.plannedQuantity();
    const finalMode = isEspoleta ? (plannedMode ?? data.modoFuncionamiento ?? null) : null;
    const finalGrad = isEspoleta ? (plannedGrad ?? data.graduacionEspoleta ?? null) : null;
    const finalLoadingZone = isCarga ? (data.loadingZone ?? null) : null;
    const finalCantidad = isSuplemento ? (plannedQty ?? data.cantidad ?? null) : null;

    this.identFormModel.update((m) => ({
      ...m,
      componente: targetCompId,
      denominacion: data.denominacion ?? null,
      lote: data.lote ?? null,
      modoFuncionamiento: finalMode,
      loadingZone: finalLoadingZone,
      cantidad: finalCantidad,
    }));
    this.numeroClienteField.set(data.numeroCliente ?? null);
    this.observacionesField.set(data.observaciones ?? null);
    this.graduacionEspoletaField.set(isEspoleta ? this.#numToField(finalGrad, 's') : null);
    this.#dirtyTracker.syncSnapshot();
  }

  save(): void {
    const identUpdates = this.getFormUpdates();
    this.#store.updateMunitionIntroductionIdentification(identUpdates);
    this.#dirtyTracker.syncSnapshot();
  }

  reset(): void {
    const stored = this.#store.munitionIntroduction().identificacion;
    const isEspoleta = this.#checkIsEspoleta(stored.componente);
    const isCarga = this.#checkIsCargaDeProyeccion(stored.componente);
    const isSuplemento = this.#checkIsSuplemento(stored.componente);
    const plannedMode = this.plannedModoFuncionamiento();
    const plannedGrad = this.plannedGraduacionEspoleta();
    const plannedQty = this.plannedQuantity();
    const finalMode = isEspoleta ? (plannedMode ?? stored.modoFuncionamiento) : null;
    const finalGrad = isEspoleta ? (plannedGrad ?? stored.graduacionEspoleta) : null;
    const finalLoadingZone = isCarga ? (stored.loadingZone ?? null) : null;
    const finalCantidad = isSuplemento ? (plannedQty ?? stored.cantidad ?? null) : null;

    this.identFormModel.set({
      componente: stored.componente,
      denominacion: stored.denominacion,
      lote: stored.lote,
      modoFuncionamiento: finalMode,
      loadingZone: finalLoadingZone,
      cantidad: finalCantidad,
    });
    this.numeroClienteField.set(stored.numeroCliente);
    this.observacionesField.set(stored.observaciones);
    this.graduacionEspoletaField.set(isEspoleta ? this.#numToField(finalGrad, 's') : null);
    this.#dirtyTracker.syncSnapshot();
  }
}
