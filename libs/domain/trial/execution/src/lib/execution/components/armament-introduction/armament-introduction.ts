import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import type { ArmamentIntroductionMassConfigDialogResult } from './armament-introduction-mass-config-dialog';
import { ArmamentIntroductionMassConfigDialog } from './armament-introduction-mass-config-dialog';
import { IntaIconComponent } from '@intaqalab/ui';

interface ArmamentIntroductionSelectForm {
  serie: string | null;
  disparo: string | null;
  arma: string | null;
  serieArma: string | null;
  tubo: string | null;
  serieTubo: string | null;
  equipoAtacado: string | null;
  equipoRetroceso: string | null;
}

@Component({
  selector: 'inta-armament-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,    
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white px-4 py-2 flex flex-col gap-5 overflow-auto">
      <!-- Header: Filtros -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center gap-1.5 flex-1 self-start">
            <ui-inta-icon name="settings" color="var(--inta-button)" />
            <h3 class="text-sm font-semibold text-gray-700 leading-tight truncat">
              {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TITLE' | translate }}
            </h3>
          </div>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="selectForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button mat-flat-button color="primary" type="button" (click)="openMassConfig()">
          {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_BTN' | translate }}
        </button>
      </div>

      <!-- Fields: 4 columns × 2 rows -->
      <div intaReadonlyContent class="flex-1 grid grid-cols-4 gap-4 min-h-0 content-start">
        <!-- Arma -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_PLACEHOLDER' | translate"
            [formField]="selectForm.arma"
          >
            @for (opt of armaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Nº serie del arma -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_ARMA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_ARMA_PLACEHOLDER' | translate"
            [formField]="selectForm.serieArma"
          >
            @for (opt of serieArmaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Tubo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_PLACEHOLDER' | translate"
            [formField]="selectForm.tubo"
          >
            @for (opt of tuboOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Nº serie del tubo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_TUBO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_TUBO_PLACEHOLDER' | translate"
            [formField]="selectForm.serieTubo"
          >
            @for (opt of serieTuboOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Equipo Atacado -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.EQUIPO_ATACADO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.EQUIPO_ATACADO_PLACEHOLDER' | translate"
            [formField]="selectForm.equipoAtacado"
          >
            @for (opt of equipoAtacadoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Equipo Retroceso -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.EQUIPO_RETROCESO_LABEL' | translate }}
          </mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.EQUIPO_RETROCESO_PLACEHOLDER' | translate"
            [formField]="selectForm.equipoRetroceso"
          >
            @for (opt of equipoRetrocesoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmamentIntroductionComponent extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #dialog = inject(MatDialog);

  // ── Signals de datos del store ────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.armamentIntroduction().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.armamentIntroduction().disparoOptions);
  protected readonly armaOptions = computed(() => this.#store.armamentIntroduction().armaOptions);
  protected readonly serieArmaOptions = computed(() => this.#store.armamentIntroduction().serieArmaOptions);
  protected readonly tuboOptions = computed(() => this.#store.armamentIntroduction().tuboOptions);
  protected readonly serieTuboOptions = computed(() => this.#store.armamentIntroduction().serieTuboOptions);
  protected readonly equipoAtacadoOptions = computed(() => this.#store.armamentIntroduction().equipoAtacadoOptions);
  protected readonly equipoRetrocesoOptions = computed(() => this.#store.armamentIntroduction().equipoRetrocesoOptions);

  // ── Signal Form ──────────────────────────────────────────────────────────
  protected readonly formModel = signal<ArmamentIntroductionSelectForm>({
    serie: this.#store.armamentIntroduction().serie,
    disparo: this.#store.armamentIntroduction().disparo,
    arma: this.#store.armamentIntroduction().arma,
    serieArma: this.#store.armamentIntroduction().serieArma,
    tubo: this.#store.armamentIntroduction().tubo,
    serieTubo: this.#store.armamentIntroduction().serieTubo,
    equipoAtacado: this.#store.armamentIntroduction().equipoAtacado,
    equipoRetroceso: this.#store.armamentIntroduction().equipoRetroceso,
  });

  protected readonly selectForm = form(this.formModel);

  // ── FormWidget implementation ────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.selectForm().dirty(),
    touched: this.selectForm().touched(),
    valid: this.selectForm().valid(),
    hasChanges: this.selectForm().dirty(),
  }));

  resetForm(): void {
    const stored = this.#store.armamentIntroduction();
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      arma: stored.arma,
      serieArma: stored.serieArma,
      tubo: stored.tubo,
      serieTubo: stored.serieTubo,
      equipoAtacado: stored.equipoAtacado,
      equipoRetroceso: stored.equipoRetroceso,
    });
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, arma, serieArma, tubo, serieTubo, equipoAtacado, equipoRetroceso } = this.formModel();
    this.#store.updateArmamentIntroduction({
      serie,
      disparo,
      arma,
      serieArma,
      tubo,
      serieTubo,
      equipoAtacado,
      equipoRetroceso,
    });
  }

  // ── Methods ──────────────────────────────────────────────────────────────

  /** Establece el disparo actual seleccionado por el JLT */
  setCurrentShot(): void {
    const jltState = this.#store.jltMao();
    if (jltState.serie && jltState.disparo) {
      this.formModel.update((f) => ({
        ...f,
        serie: jltState.serie,
        disparo: jltState.disparo,
      }));
    }
  }

  /** Abre el modal de configuración masiva */
  openMassConfig(): void {
    const state = this.#store.armamentIntroduction();
    this.#dialog
      .open(ArmamentIntroductionMassConfigDialog, {
        data: {
          serieOptions: state.serieOptions,
          armaOptions: state.armaOptions,
          serieArmaOptions: state.serieArmaOptions,
          tuboOptions: state.tuboOptions,
          serieTuboOptions: state.serieTuboOptions,
          equipoAtacadoOptions: state.equipoAtacadoOptions,
          equipoRetrocesoOptions: state.equipoRetrocesoOptions,
          current: {
            arma: state.arma,
            serieArma: state.serieArma,
            tubo: state.tubo,
            serieTubo: state.serieTubo,
            equipoAtacado: state.equipoAtacado,
            equipoRetroceso: state.equipoRetroceso,
          },
        },
      })
      .afterClosed()
      .subscribe((result: ArmamentIntroductionMassConfigDialogResult | undefined) => {
        if (result?.action === 'apply') {
          // Actualizar con los valores del modal
          this.#store.updateArmamentIntroduction({
            serie: result.series?.length ? result.series[0] : state.serie,
            disparo: state.disparo,
            arma: result.arma ?? state.arma,
            serieArma: result.serieArma ?? state.serieArma,
            tubo: result.tubo ?? state.tubo,
            serieTubo: result.serieTubo ?? state.serieTubo,
            equipoAtacado: result.equipoAtacado ?? state.equipoAtacado,
            equipoRetroceso: result.equipoRetroceso ?? state.equipoRetroceso,
          });
          // Actualizar el formulario local
          this.resetForm();
        }
      });
  }
}
