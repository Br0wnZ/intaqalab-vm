import type { Signal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { ShotMunitionResponse } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import type { MassiveConfigDialogData } from './massive-config-dialog';
import { MassiveConfigDialog } from './massive-config-dialog';
import {
  mapMunitionStateToRequest,
  mapPlanningSeriesToOptions,
  mapRemoteToMunitionState,
  mapShotsToDisparoOptions,
} from './munition-introduction.mapper';
import { MunitionAcondicionamientoTabComponent } from './tabs/acondicionamiento-tab.component';
import { MunitionIdentificacionTabComponent } from './tabs/identificacion-tab.component';
import { MunitionPesosTabComponent } from './tabs/pesos-tab.component';

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
    FormTouchDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    MunitionIdentificacionTabComponent,
    MunitionPesosTabComponent,
    MunitionAcondicionamientoTabComponent,
    IntaIconComponent,
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
            (selectionChange)="onSerieSelected($event.value)"
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
            (selectionChange)="onDisparoSelected($event.value)"
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
        <button mat-flat-button color="primary" type="button" (click)="applyMassiveConfig()">
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
      <div intaReadonlyContent intaFormTouch class="flex-1 min-h-0" #touch="intaFormTouch">
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
  readonly #executionService = inject(ExecutionService);
  readonly #dialog = inject(MatDialog);
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  // ── UI state (local) ───────────────────────────────────────────────────────
  protected readonly activeTab = signal<TabType>('identificacion');

  // ── ViewChildren para delegar estado ────────────────────────────────────────
  readonly identTab = viewChild(MunitionIdentificacionTabComponent);
  readonly pesosTab = viewChild(MunitionPesosTabComponent);
  readonly acondTab = viewChild(MunitionAcondicionamientoTabComponent);
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  // ── Selection Guard ────────────────────────────────────────────────────────
  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => {
    const planningSeries = this.#store.planningSeries();
    return mapPlanningSeriesToOptions(planningSeries, this.#store.munitionIntroduction().serieOptions);
  });

  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const progressShots = this.#store
      .executionProgress()
      ?.series.find((serie) => serie.seriesId === selectedSerie)?.shots;
    if (progressShots?.length) {
      return mapShotsToDisparoOptions(progressShots, this.#store.munitionIntroduction().disparoOptions);
    }
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerie)?.shots;
    if (planningShots?.length) {
      return mapShotsToDisparoOptions(planningShots, this.#store.munitionIntroduction().disparoOptions);
    }
    return this.#store.munitionIntroduction().disparoOptions;
  });

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

  // ── Dirty tracking: los selectores serie/disparo son de consulta y NO
  //    participan del estado dirty. Solo cuentan las tabs de datos. ──────────
  protected readonly isDirty = computed(
    () =>
      (this.identTab()?.isDirty() ?? false) ||
      (this.pesosTab()?.isDirty() ?? false) ||
      (this.acondTab()?.isDirty() ?? false),
  );

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
    touched: this.touchRef()?.touched() ?? false,
    valid: this.isValid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

    // Sincronizar y cargar el disparo activo cuando el store lo proporcione o cambie
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId() ?? this.serieOptions()[0]?.value ?? null;
      const activeShotId = this.#store.activeShotId() ?? this.disparoOptions()[0]?.value ?? null;

      if (!fireTrialId || !activeSerieId || !activeShotId) {
        return;
      }

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastLoadedActiveSelection() === selectionKey) {
        return;
      }

      untracked(() => {
        this.#lastLoadedActiveSelection.set(selectionKey);
        this.#setSelection(activeSerieId, activeShotId);
      });
    });
  }

  onSerieSelected(serie: string | null): void {
    const current = this.selectorFormModel();
    const disparo = this.#isShotInSerie(current.disparo, serie) ? current.disparo : null;

    this.selectorFormModel.set({
      serie,
      disparo,
    });

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    const current = this.selectorFormModel();
    this.selectorFormModel.set({
      ...current,
      disparo,
    });

    this.#syncSelectionToStore(current.serie, disparo);
    void this.#loadSelectedShotData();
  }

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
    const serie = this.#store.activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = this.#store.activeShotId() ?? this.selectorFormModel().disparo;

    this.#setSelection(serie, disparo);
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.set({
      serie,
      disparo,
    });

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  resetForm(): void {
    const stored = this.#store.munitionIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });

    // Delegar reset
    this.identTab()?.reset();
    this.pesosTab()?.reset();
    this.acondTab()?.reset();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();

    this.#store.updateMunitionIntroductionSelector({ serie, disparo });

    if (fireTrialId && serie && disparo) {
      const identUpdates = this.identTab()?.getFormUpdates() ?? this.#store.munitionIntroduction().identificacion;
      const pesosUpdates = this.pesosTab()?.getFormUpdates() ?? this.#store.munitionIntroduction().pesos;
      const acondUpdates = this.acondTab()?.getFormUpdates() ?? this.#store.munitionIntroduction().acondicionamiento;

      const componentId =
        identUpdates.componente ??
        pesosUpdates.componente ??
        acondUpdates.componente ??
        this.#store.munitionIntroduction().componenteOptions[0]?.value ??
        'granada-01';

      const payload = mapMunitionStateToRequest({
        componentId,
        identificacion: identUpdates,
        pesos: pesosUpdates,
        acondicionamiento: acondUpdates,
      });

      try {
        await this.#executionService.updateShotMunition(fireTrialId, serie, disparo, payload);
        this.identTab()?.save();
        this.pesosTab()?.save();
        this.acondTab()?.save();
      } catch (error) {
        console.error('Failed to save shot munition', error);
        throw error;
      }
    } else {
      this.identTab()?.save();
      this.pesosTab()?.save();
      this.acondTab()?.save();
    }
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.selectorFormModel();
    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) {
      return;
    }

    try {
      const response = await this.#executionService.fetchShotMunition(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData({ munitionData: [] });
    }
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.updateMunitionIntroductionSelector({
      serie,
      disparo,
    });
  }

  #isShotInSerie(disparo: string | null, serie: string | null): boolean {
    if (!disparo || !serie) {
      return false;
    }

    return (
      this.#store
        .executionProgress()
        ?.series.some((s) => s.seriesId === serie && s.shots.some((shot) => shot.shotId === disparo)) ?? false
    );
  }

  #applyRemoteShotData(response: ShotMunitionResponse): void {
    const mapped = mapRemoteToMunitionState(response);
    if (mapped.identificacion && Object.keys(mapped.identificacion).length > 0) {
      this.#store.updateMunitionIntroductionIdentification(mapped.identificacion);
      this.identTab()?.applyData(mapped.identificacion);
    }
    if (mapped.pesos && Object.keys(mapped.pesos).length > 0) {
      this.#store.updateMunitionIntroductionPesos(mapped.pesos);
      this.pesosTab()?.applyData(mapped.pesos);
    }
    if (mapped.acondicionamiento && Object.keys(mapped.acondicionamiento).length > 0) {
      this.#store.updateMunitionIntroductionAcondicionamiento(mapped.acondicionamiento);
      this.acondTab()?.applyData(mapped.acondicionamiento);
    }
  }
}
