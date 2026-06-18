import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import type { MassiveConfigDialogData } from './massive-config-dialog';
import { MassiveConfigDialog } from './massive-config-dialog';
import { MunitionAcondicionamientoTabComponent } from './tabs/acondicionamiento-tab.component';
import { MunitionIdentificacionTabComponent } from './tabs/identificacion-tab.component';
import { MunitionPesosTabComponent } from './tabs/pesos-tab.component';
import { IntaIconComponent } from "@intaqalab/ui";

export type TabType = 'identificacion' | 'pesos' | 'acondicionamiento';
export type InputFieldValue = { value: string; unit: string } | null;

export interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

export interface IdentFormModel {
  componente: string | null;
  denominacion: string | null;
  lote: string | null;
  modoFuncionamiento: string | null;
}

export interface PesosFormModel {
  componente: string | null;
  balanza: string | null;
}

export interface AcondFormModel {
  camara: string | null;
  componente: string | null;
}

@Component({
  selector: 'inta-munition-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    MunitionIdentificacionTabComponent,
    MunitionPesosTabComponent,
    MunitionAcondicionamientoTabComponent,
    IntaIconComponent
],
  template: `
    <div class="h-full rounded-2xl bg-white p-2 flex flex-col gap-2 overflow-auto">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="selectorForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectorForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <!-- Aplicar configuración masiva -->
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="applyMassiveConfig()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MASSIVE_CONFIG_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Tab chips -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
            [class]="
              activeTab() === 'identificacion'
                ? 'bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('identificacion')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TAB_IDENTIFICACION' | translate }}
          </button>
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
            [class]="
              activeTab() === 'pesos'
                ? 'bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('pesos')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TAB_PESOS' | translate }}
          </button>
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
            [class]="
              activeTab() === 'acondicionamiento'
                ? 'bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('acondicionamiento')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TAB_ACONDICIONAMIENTO' | translate }}
          </button>
        </div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- ── Tab bodies ───────────────────────────────────────────────────── -->
      <!-- Se utiliza [class.hidden] en lugar de @switch para preservar el estado interno de las tabs -->
      <div intaReadonlyContent class="flex-1 min-h-0">
        <inta-munition-identificacion-tab [class.hidden]="activeTab() !== 'identificacion'" />
        <inta-munition-pesos-tab [class.hidden]="activeTab() !== 'pesos'" />
        <inta-munition-acondicionamiento-tab [class.hidden]="activeTab() !== 'acondicionamiento'" />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionIntroduction extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #dialog = inject(MatDialog);

  // ── UI state (local) ───────────────────────────────────────────────────────
  protected readonly activeTab = signal<TabType>('identificacion');

  // ── ViewChildren para delegar estado ────────────────────────────────────────
  readonly identTab = viewChild(MunitionIdentificacionTabComponent);
  readonly pesosTab = viewChild(MunitionPesosTabComponent);
  readonly acondTab = viewChild(MunitionAcondicionamientoTabComponent);

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.munitionIntroduction().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.munitionIntroduction().disparoOptions);

  protected readonly estadoDisparo = computed(() => this.#store.munitionIntroduction().estadoDisparo);
  protected readonly estadoLabel = computed(() => {
    const e = this.estadoDisparo();
    return e === 'EN_CURSO' ? 'En curso' : e === 'PENDIENTE' ? 'Pendiente' : e === 'EJECUTADA' ? 'Ejecutada' : '';
  });
  protected readonly estadoClass = computed(() => {
    const e = this.estadoDisparo();
    return e === 'EN_CURSO'
      ? 'bg-blue-100 text-blue-700'
      : e === 'PENDIENTE'
        ? 'bg-slate-100 text-slate-700'
        : e === 'EJECUTADA'
          ? 'bg-green-100 text-green-700'
          : '';
  });

  // ── Forms ──────────────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.munitionIntroduction().serie,
    disparo: this.#store.munitionIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // ── Snapshot for dirty tracking ────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    serie: this.selectorFormModel().serie,
    disparo: this.selectorFormModel().disparo,
  });

  protected readonly isDirty = computed(() => {
    const localDirty =
      this.selectorForm().dirty() ||
      this.selectorFormModel().serie !== this.#savedSnapshot().serie ||
      this.selectorFormModel().disparo !== this.#savedSnapshot().disparo;

    return (
      localDirty ||
      (this.identTab()?.isDirty() ?? false) ||
      (this.pesosTab()?.isDirty() ?? false) ||
      (this.acondTab()?.isDirty() ?? false)
    );
  });

  protected readonly isValid = computed(() => {
    return (
      this.selectorForm().valid() &&
      (this.identTab()?.isValid() ?? true) &&
      (this.pesosTab()?.isValid() ?? true) &&
      (this.acondTab()?.isValid() ?? true)
    );
  });

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.isValid(),
    hasChanges: this.isDirty(),
  }));

  applyMassiveConfig(): void {
    const stored = this.#store.munitionIntroduction();

    // Obtenemos el modelo actual del tab (aún si no se ha guardado) para mantener la experiencia de usuario.
    // Si la tab aún no fue montada o no existe, usamos los valores del store.
    const acondModel = this.acondTab()?.getFormModel() ?? {
      camara: stored.acondicionamiento.camara,
      componente: stored.acondicionamiento.componente,
    };
    const camaraLabel = stored.camaraOptions.find((c) => c.value === acondModel.camara)?.label ?? '';

    const data: MassiveConfigDialogData = {
      camaraLabel,
      componente: acondModel.componente,
      temperaturaCorregida: stored.acondicionamiento.temperaturaCorregida,
      fechaHoraEntrada: this.acondTab()?.fechaHoraEntradaField() ?? stored.acondicionamiento.fechaHoraEntrada,
      fechaHoraSalida: this.acondTab()?.fechaHoraSalidaField() ?? stored.acondicionamiento.fechaHoraSalida,
      serieOptions: stored.serieOptions,
      componenteOptions: stored.componenteOptions,
    };
    this.#dialog.open(MassiveConfigDialog, { width: '640px', data });
  }

  setCurrentShot(): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
  }

  resetForm(): void {
    const stored = this.#store.munitionIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.#syncSnapshot();

    // Delegar reset
    this.identTab()?.reset();
    this.pesosTab()?.reset();
    this.acondTab()?.reset();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    this.#store.updateMunitionIntroductionSelector({ serie, disparo });
    this.#syncSnapshot();

    // Delegar save a las pestañas autónomas
    this.identTab()?.save();
    this.pesosTab()?.save();
    this.acondTab()?.save();
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      serie: this.selectorFormModel().serie,
      disparo: this.selectorFormModel().disparo,
    });
  }
}
