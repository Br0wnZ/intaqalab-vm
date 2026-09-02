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
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { ShotTrajectographyResponse } from '../../models/shot-trajectography.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import { TrayectografiaFuncionamientosTabComponent } from './tabs/funcionamientos-tab.component';
import { TrayectografiasTrayectoriasTabComponent } from './tabs/trayectorias-tab.component';
import { TrayectografiaTrazasTabComponent } from './tabs/trazas-tab.component';
import {
  mapPlanningSeriesToOptions,
  mapRemoteToTrayectografiaState,
  mapShotStatusToClass,
  mapShotStatusToLabel,
  mapShotsToDisparoOptions,
  mapTrayectografiaStateToRequest,
} from './trayectografia-introduction.mapper';

export type TrayectografiaTab = 'trayectorias' | 'funcionamientos' | 'trazas';

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

@Component({
  selector: 'inta-trayectografia-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    TrayectografiasTrayectoriasTabComponent,
    TrayectografiaFuncionamientosTabComponent,
    TrayectografiaTrazasTabComponent,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-2">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="selectorForm.serie"
            (selectionChange)="onSerieSelected($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-30">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
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
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Tab chips -->
        <div class="flex items-start gap-1 shrink-0 h-full lg:mr-4">
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
            [class]="
              activeTab() === 'trayectorias'
                ? 'bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('trayectorias')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TAB_TRAYECTORIAS' | translate }}
          </button>
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
            [class]="
              activeTab() === 'funcionamientos'
                ? 'bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('funcionamientos')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TAB_FUNCIONAMIENTOS' | translate }}
          </button>
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
            [class]="
              activeTab() === 'trazas'
                ? 'bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('trazas')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TAB_TRAZAS' | translate }}
          </button>
        </div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Tab bodies ───────────────────────────────────────────────────── -->
      <!-- [class.hidden] preserva el estado interno de cada tab -->
      <div intaReadonlyContent class="flex-1 min-h-0">
        <inta-trayectografia-trayectorias-tab
          [class.hidden]="activeTab() !== 'trayectorias'"
          [equipo]="equipoField()"
          (equipoChange)="onEquipoChange($event)"
        />
        <inta-trayectografia-funcionamientos-tab
          [class.hidden]="activeTab() !== 'funcionamientos'"
          [equipo]="equipoField()"
          (equipoChange)="onEquipoChange($event)"
        />
        <inta-trayectografia-trazas-tab
          [class.hidden]="activeTab() !== 'trazas'"
          [equipo]="equipoField()"
          (equipoChange)="onEquipoChange($event)"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrayectografiaIntroductionWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);

  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  protected readonly activeTab = signal<TrayectografiaTab>('trayectorias');

  // ── ViewChildren para delegar estado ──────────────────────────────────────
  readonly trayectoriasTab = viewChild(TrayectografiasTrayectoriasTabComponent);
  readonly funcionamientosTab = viewChild(TrayectografiaFuncionamientosTabComponent);
  readonly trazasTab = viewChild(TrayectografiaTrazasTabComponent);

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#store.planningSeries(), this.#store.trayectografiaIntroduction().serieOptions),
  );
  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const progressShots = this.#store
      .executionProgress()
      ?.series.find((serie) => serie.seriesId === selectedSerie)?.shots;
    if (progressShots?.length) {
      return mapShotsToDisparoOptions(progressShots, this.#store.trayectografiaIntroduction().disparoOptions);
    }
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerie)?.shots;
    if (planningShots?.length) {
      return mapShotsToDisparoOptions(planningShots, this.#store.trayectografiaIntroduction().disparoOptions);
    }
    return this.#store.trayectografiaIntroduction().disparoOptions;
  });

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() =>
    mapShotStatusToLabel(this.#store.trayectografiaIntroduction().estadoDisparo),
  );

  protected readonly estadoClass = computed(() =>
    mapShotStatusToClass(this.#store.trayectografiaIntroduction().estadoDisparo),
  );

  // ── Selector form (serie / disparo) ────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.trayectografiaIntroduction().serie,
    disparo: this.#store.trayectografiaIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // ── Equipo — managed separately (cross-tab shared field) ──────────────────
  protected readonly equipoField = signal<string | null>(this.#store.trayectografiaIntroduction().equipo);

  // ── Snapshot for equipo dirty tracking ────────────────────────────────────
  readonly #equipoSnapshot = signal<string | null>(this.#store.trayectografiaIntroduction().equipo);

  // ── Dirty / Valid aggregate ────────────────────────────────────────────────
  protected readonly isDirty = computed(() => {
    if (this.selectorForm().dirty()) return true;
    if (this.equipoField() !== this.#equipoSnapshot()) return true;
    return (
      (this.trayectoriasTab()?.isDirty() ?? false) ||
      (this.funcionamientosTab()?.isDirty() ?? false) ||
      (this.trazasTab()?.isDirty() ?? false)
    );
  });

  protected readonly isValid = computed(() => {
    return (
      this.selectorForm().valid() &&
      (this.trayectoriasTab()?.isValid() ?? true) &&
      (this.funcionamientosTab()?.isValid() ?? true) &&
      (this.trazasTab()?.isValid() ?? true)
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

  constructor() {
    super();

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId() ?? this.serieOptions()?.[0]?.value ?? null;
      const activeShotId = this.#store.activeShotId() ?? this.disparoOptions()?.[0]?.value ?? null;

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
    this.selectorFormModel.update((m) => ({ ...m, serie }));
    this.#store.updateTrayectografiaSelector({ serie });
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    this.selectorFormModel.update((m) => ({ ...m, disparo }));
    this.#store.updateTrayectografiaSelector({ disparo });
    void this.#loadSelectedShotData();
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));
    this.#store.updateTrayectografiaSelector({ serie, disparo });
    void this.#loadSelectedShotData();
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
      const response = await this.#executionService.fetchShotTrajectography(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
    }
  }

  #applyRemoteShotData(response: ShotTrajectographyResponse): void {
    const remote = mapRemoteToTrayectografiaState(response);

    if (remote.equipo !== undefined) {
      this.#store.updateTrayectografiaSelector({ equipo: remote.equipo });
      this.equipoField.set(remote.equipo);
      this.#equipoSnapshot.set(remote.equipo);
    }

    if (remote.trayectorias) {
      this.#store.updateTrayectografiaTrayectorias(remote.trayectorias);
      this.trayectoriasTab()?.reset();
    }

    if (remote.funcionamientos) {
      this.#store.updateTrayectografiaFuncionamientos(remote.funcionamientos);
      this.funcionamientosTab()?.reset();
    }

    if (remote.trazas) {
      this.#store.updateTrayectografiaTrazas(remote.trazas);
      this.trazasTab()?.reset();
    }
  }

  onEquipoChange(value: string | null): void {
    this.equipoField.set(value);
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    const serie = activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = activeShotId() ?? this.selectorFormModel().disparo;
    this.#setSelection(serie, disparo);
  }

  resetForm(): void {
    const stored = this.#store.trayectografiaIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.equipoField.set(stored.equipo);
    this.#equipoSnapshot.set(stored.equipo);
    this.trayectoriasTab()?.reset();
    this.funcionamientosTab()?.reset();
    this.trazasTab()?.reset();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    this.#store.updateTrayectografiaSelector({ serie, disparo, equipo: this.equipoField() });
    this.#equipoSnapshot.set(this.equipoField());
    this.trayectoriasTab()?.save();
    this.funcionamientosTab()?.save();
    this.trazasTab()?.save();

    const fireTrialId = this.#store.fireTrialId();
    if (fireTrialId && serie && disparo) {
      const state = this.#store.trayectografiaIntroduction();
      const payload = mapTrayectografiaStateToRequest({
        equipo: this.equipoField(),
        trayectorias: state.trayectorias,
        funcionamientos: state.funcionamientos,
        trazas: state.trazas,
      });
      await this.#executionService.updateShotTrajectography(fireTrialId, serie, disparo, payload);
    }
  }
}
