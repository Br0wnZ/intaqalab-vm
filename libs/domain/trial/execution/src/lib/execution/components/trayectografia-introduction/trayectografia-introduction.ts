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
import { TrayectografiaFuncionamientosTabComponent } from './tabs/funcionamientos-tab.component';
import { TrayectografiasTrayectoriasTabComponent } from './tabs/trayectorias-tab.component';
import { TrayectografiaTrazasTabComponent } from './tabs/trazas-tab.component';

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
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    TrayectografiasTrayectoriasTabComponent,
    TrayectografiaFuncionamientosTabComponent,
    TrayectografiaTrazasTabComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-2">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 shrink-0">
            <mat-icon class="text-violet-600 !text-[16px] !w-[16px] !h-[16px]">edit</mat-icon>
          </div>
          <h3 class="text-xs font-semibold text-slate-800 leading-tight whitespace-nowrap">
            {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="selectorForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectorForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button
          mat-flat-button
          color="primary"
          type="button"
          class="!bg-violet-600 !text-white !text-xs !h-8 !px-3 !rounded-xl"
          (click)="setCurrentShot()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Tab chips -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors"
            [class]="
              activeTab() === 'trayectorias'
                ? 'bg-violet-600 text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('trayectorias')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TAB_TRAYECTORIAS' | translate }}
          </button>
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors"
            [class]="
              activeTab() === 'funcionamientos'
                ? 'bg-violet-600 text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
            "
            (click)="activeTab.set('funcionamientos')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TAB_FUNCIONAMIENTOS' | translate }}
          </button>
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors"
            [class]="
              activeTab() === 'trazas'
                ? 'bg-violet-600 text-white'
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

  // ── UI state ───────────────────────────────────────────────────────────────
  protected readonly activeTab = signal<TrayectografiaTab>('trayectorias');

  // ── ViewChildren para delegar estado ──────────────────────────────────────
  readonly trayectoriasTab = viewChild(TrayectografiasTrayectoriasTabComponent);
  readonly funcionamientosTab = viewChild(TrayectografiaFuncionamientosTabComponent);
  readonly trazasTab = viewChild(TrayectografiaTrazasTabComponent);

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.trayectografiaIntroduction().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.trayectografiaIntroduction().disparoOptions);

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.trayectografiaIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'En curso';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EJECUTADA':
        return 'Ejecutada';
      default:
        return '—';
    }
  });

  protected readonly estadoClass = computed(() => {
    switch (this.#store.trayectografiaIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'bg-green-100 text-green-700';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-700';
      case 'EJECUTADA':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

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

  onEquipoChange(value: string | null): void {
    this.equipoField.set(value);
  }

  setCurrentShot(): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
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
  }
}
