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
import { injectTrialShots } from '@intaqalab/data-access-planning';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ExecutionStore, type MunitionIntroIdentificationState } from '../../../+state/execution.store';
import { injectShotMunitionComponents } from '../../../data-access';
import { ExecutionService } from '../../../services/execution.service';
import type { ShotMunitionResponse } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import { resolveInitialShotSelection } from '../utils/selection-options';
import type { MassiveConfigDialogData, MassiveConfigDialogResult } from './massive-config-dialog';
import { MassiveConfigDialog } from './massive-config-dialog';
import {
  buildDisparoOptions,
  mapMunitionStateToRequest,
  mapPlanningSeriesToOptions,
  resolveCamaraId,
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

/** @deprecated Renamed to WeightFormModel in pesos-tab.component */
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
        @if (activeTab() === 'acondicionamiento') {
          <button mat-flat-button color="primary" type="button" (click)="applyMassiveConfig()">
            {{ 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MASSIVE_CONFIG_BTN' | translate }}
          </button>
        }

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

          <!-- Estado del disparo -->
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
            {{ estadoLabel() }}
          </span>
        </div>
      </div>

      <!-- ── Tab bodies ───────────────────────────────────────────────────── -->
      <!-- Se utiliza [class.hidden] en lugar de @switch para preservar el estado interno de las tabs -->
      <div intaFormTouch class="flex-1 min-h-0 mt-8 gap-8" #touch="intaFormTouch">
        <inta-munition-identificacion-tab
          [class.hidden]="activeTab() !== 'identificacion'"
          [componenteOptions]="componenteOptions()"
          (componentChange)="onComponentChange($event)"
          (denominationChange)="onDenominationSelected()"
        />
        <inta-munition-pesos-tab
          [class.hidden]="activeTab() !== 'pesos'"
          [componenteOptions]="componenteOptions()"
          (componentChange)="onComponentChange($event)"
          (balanceChange)="onBalanceChange()"
        />
        <inta-munition-acondicionamiento-tab
          [class.hidden]="activeTab() !== 'acondicionamiento'"
          [plannedComponenteOptions]="componenteOptions()"
          (componentChange)="onComponentChange($event)"
        />
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
  readonly #trialShots = injectTrialShots();
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  // ── Reactive shot-scoped planning munition components ─────────────────────
  readonly #shotComponentsHandle = injectShotMunitionComponents({
    seriesId: computed(() => this.selectorFormModel().serie),
    shotId: computed(() => this.selectorFormModel().disparo),
    fireTrialId: computed(() => this.#store.fireTrialId()),
  });
  protected readonly componenteOptions = this.#shotComponentsHandle.components;

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
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(
      this.#trialShots.series() ?? this.#store.planningSeries(),
      this.#store.munitionIntroduction().serieOptions,
    ),
  );

  #buildDisparoOptions(selectedSerie: string | null) {
    return buildDisparoOptions({
      selectedSerie,
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
      storedOptions: this.#store.munitionIntroduction().disparoOptions,
    });
  }

  protected readonly disparoOptions = computed(() => this.#buildDisparoOptions(this.selectorFormModel().serie));

  protected readonly selectedShotProgress = computed(() => {
    const { serie, disparo } = this.selectorFormModel();
    const selectedSeries = this.#store.executionProgress()?.series.find((item) => item.seriesId === serie);
    return disparo ? (selectedSeries?.shots.find((shot) => shot.shotId === disparo) ?? null) : null;
  });

  protected readonly isCurrentShot = computed(() => {
    const { serie, disparo } = this.selectorFormModel();
    return serie === this.#store.activeSerieId() && disparo === this.#store.activeShotId();
  });

  protected readonly estadoDisparo = computed(() => {
    if (this.isCurrentShot()) {
      return 'EN_CURSO';
    }

    switch (this.selectedShotProgress()?.status) {
      case 'ACTIVE':
        return 'EN_CURSO';
      case 'PENDING':
        return 'PENDIENTE';
      case 'FIRED':
        return 'EJECUTADA';
      default:
        return this.#store.munitionIntroduction().estadoDisparo;
    }
  });
  protected readonly estadoLabel = computed(() => {
    const e = this.estadoDisparo();
    return e === 'EN_CURSO' ? 'En curso' : e === 'PENDIENTE' ? 'Pendiente' : e === 'EJECUTADA' ? 'Ejecutado' : '';
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
      const selection = resolveInitialShotSelection({
        seriesOptions: this.serieOptions(),
        activeSerieId: this.#store.activeSerieId(),
        activeShotId: this.#store.activeShotId(),
        getShotOptions: (serieId) => this.#buildDisparoOptions(serieId),
      });
      const { serie: activeSerieId, disparo: activeShotId } = selection;

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

    // Auto-seleccionar primer componente disponible cuando cambian las opciones
    effect(() => {
      const options = this.componenteOptions();
      const current = this.#store.munitionIntroduction().selectedComponentId;
      if (options.length === 0) {
        return;
      }
      if (!current || !options.some((o) => o.value === current)) {
        const nextId = options[0]?.value;
        if (nextId) {
          untracked(() => this.onComponentChange(nextId));
        }
      }
    });
  }

  #patchPlanningIdentificationForComponent(componentId: string | null): void {
    if (!componentId) return;

    const planned = this.#shotComponentsHandle.findComponent(componentId)?.planned;
    const currentIdent = this.#store.munitionIntroduction().identificacion;
    const patched: MunitionIntroIdentificationState = {
      ...currentIdent,
      componente: componentId,
      denominacion: currentIdent.denominacion ?? planned?.denominationId ?? null,
      lote: currentIdent.lote ?? planned?.batch ?? null,
      numeroCliente: currentIdent.numeroCliente ?? planned?.clientNumber ?? null,
    };
    this.#store.updateMunitionIntroductionIdentification(patched);
    this.identTab()?.applyData(patched);
  }

  onSerieSelected(serie: string | null): void {
    const disparo = this.#buildDisparoOptions(serie)[0]?.value ?? null;
    this.selectorFormModel.set({ serie, disparo });
    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    const current = this.selectorFormModel();
    this.selectorFormModel.set({ ...current, disparo });
    this.#syncSelectionToStore(current.serie, disparo);
    void this.#loadSelectedShotData();
  }

  async applyMassiveConfig(): Promise<void> {
    const stored = this.#store.munitionIntroduction();
    const fireTrialId = this.#store.fireTrialId();
    if (!fireTrialId) return;

    const planningSeries = this.#store.planningSeries() ?? [];
    const progressSeries = this.#store.executionProgress()?.series ?? [];
    const assignedShotIdsBySeries = Object.fromEntries(
      this.serieOptions().map(({ value: seriesId }) => {
        const plannedShots = planningSeries.find((series) => series.id === seriesId)?.shots;
        const shotIds = plannedShots?.length
          ? plannedShots.map((shot) => shot.id)
          : (progressSeries.find((series) => series.seriesId === seriesId)?.shots ?? []).map((shot) => shot.shotId);
        return [seriesId, shotIds];
      }),
    );

    // Obtenemos el modelo actual del tab (aún si no se ha guardado) para mantener la experiencia de usuario.
    // Si la tab aún no fue montada o no existe, usamos los valores del store.
    const acondModel = this.acondTab()?.getFormModel() ?? {
      camara: stored.acondicionamiento.camara,
      componente: stored.acondicionamiento.componente,
    };
    const camaraLabel =
      stored.camaraOptions.find((c) => c.value === acondModel.camara)?.label ?? acondModel.camara ?? '';

    const currentSerie = this.selectorFormModel().serie ?? this.#store.activeSerieId();
    const data: MassiveConfigDialogData = {
      fireTrialId,
      assignedShotIdsBySeries,
      camaraLabel,
      climaticChamberId: resolveCamaraId(acondModel.camara),
      componente: acondModel.componente,
      temperaturaCorregida: stored.acondicionamiento.temperaturaCorregida,
      fechaHoraEntrada: this.acondTab()?.fechaHoraEntradaField() ?? stored.acondicionamiento.fechaHoraEntrada,
      fechaHoraSalida: this.acondTab()?.fechaHoraSalidaField() ?? stored.acondicionamiento.fechaHoraSalida,
      serieOptions: this.serieOptions(),
      componenteOptions: this.componenteOptions(),
      initialSeries: currentSerie ? [currentSerie] : [],
    };
    const dialogRef = this.#dialog.open<MassiveConfigDialog, MassiveConfigDialogData, MassiveConfigDialogResult>(
      MassiveConfigDialog,
      { width: '640px', data },
    );
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result?.updatedShotIds.includes(this.selectorFormModel().disparo ?? '')) {
      await this.#loadSelectedShotData();
    }
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

  onComponentChange(componentId: string): void {
    this.#store.selectMunitionComponent(componentId);
    this.#patchPlanningIdentificationForComponent(componentId);

    const stored = this.#store.munitionIntroduction();
    this.identTab()?.applyData(stored.identificacion);
    this.pesosTab()?.applyData(stored.weight);
    this.acondTab()?.applyData(stored.acondicionamiento);
    this.touchRef()?.reset();
  }

  onDenominationSelected(): void {
    // Delegated to identTab reactive injectDenominationBatches
  }

  onBalanceChange(): void {
    if (!this.isDirty()) {
      this.touchRef()?.reset();
    }
  }

  resetForm(): void {
    const stored = this.#store.munitionIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });

    if (stored.selectedComponentId) {
      this.#store.selectMunitionComponent(stored.selectedComponentId);
    }

    // Delegar reset a las tabs hijas
    this.identTab()?.reset();
    this.pesosTab()?.reset();
    this.acondTab()?.reset();
    this.touchRef()?.reset();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();

    this.#store.updateMunitionIntroductionSelector({ serie, disparo });

    if (fireTrialId && serie && disparo) {
      const identUpdates = this.identTab()?.getFormUpdates() ?? this.#store.munitionIntroduction().identificacion;
      const acondUpdates = this.acondTab()?.getFormUpdates() ?? this.#store.munitionIntroduction().acondicionamiento;

      // Persist current balance edits from the tab before building the payload
      const currentWeightUpdates = this.pesosTab()?.getFormUpdates();
      if (currentWeightUpdates?.balance) {
        this.#store.updateMunitionIntroductionWeightByBalance(currentWeightUpdates.balance, currentWeightUpdates);
      }

      // Collect all in-memory weight data across all balances
      const weightDataByBalance = this.#store.munitionIntroduction().weightDataByBalance;

      const componentId =
        this.#store.munitionIntroduction().selectedComponentId ??
        identUpdates.componente ??
        this.#store.munitionIntroduction().weight.componente ??
        this.componenteOptions()[0]?.value ??
        'granada-01';

      const existingComponents = this.#store.munitionIntroduction().remoteMunitionResponse?.munitionData ?? [];

      const payload = mapMunitionStateToRequest({
        componentId,
        identificacion: identUpdates,
        weightDataByBalance,
        acondicionamiento: acondUpdates,
        existingComponents,
      });

      try {
        const updatedResponse = await this.#executionService.updateShotMunition(fireTrialId, serie, disparo, payload);
        this.identTab()?.save();
        this.pesosTab()?.save();
        this.acondTab()?.save();
        this.#store.loadMunitionIntroductionRemoteResponse(updatedResponse, componentId);
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

  #applyRemoteShotData(response: ShotMunitionResponse): void {
    const preferredComponent = this.#store.munitionIntroduction().selectedComponentId;
    this.#store.loadMunitionIntroductionRemoteResponse(response, preferredComponent);

    const stored = this.#store.munitionIntroduction();
    const currentIdent = stored.identificacion;
    const activeComp = stored.selectedComponentId;
    const planned = activeComp ? this.#shotComponentsHandle.findComponent(activeComp)?.planned : undefined;

    if (planned) {
      const patched: MunitionIntroIdentificationState = {
        ...currentIdent,
        denominacion: currentIdent.denominacion || (planned.denominationId ?? null),
        lote: currentIdent.lote || (planned.batch ?? null),
        numeroCliente: currentIdent.numeroCliente || (planned.clientNumber ?? null),
      };
      if (
        patched.denominacion !== currentIdent.denominacion ||
        patched.lote !== currentIdent.lote ||
        patched.numeroCliente !== currentIdent.numeroCliente
      ) {
        this.#store.updateMunitionIntroductionIdentification(patched);
      }
    }

    const finalStored = this.#store.munitionIntroduction();
    this.identTab()?.applyData(finalStored.identificacion);
    this.pesosTab()?.applyData(finalStored.weight);
    this.acondTab()?.applyData(finalStored.acondicionamiento);
  }
}
