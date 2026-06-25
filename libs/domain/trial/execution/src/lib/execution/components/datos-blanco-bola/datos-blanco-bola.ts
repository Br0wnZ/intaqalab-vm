import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import type { InputFieldValue } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import {
  AplicarConfigMasivaDialog,
  type AplicarConfigMasivaDialogData,
  type AplicarConfigMasivaDialogResult,
} from './aplicar-config-masiva-dialog';

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

@Component({
  selector: 'inta-datos-blanco-bola',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-3 flex flex-col gap-2 overflow-auto">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.SERIE_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectorForm.serie">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.DISPARO_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectorForm.disparo">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button mat-flat-button type="button" (click)="openMasivaDialog()">
          {{ 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.MASIVA_BTN' | translate }}
        </button>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- ── Body ────────────────────────────────────────────────────────── -->
      <div
        intaReadonlyContent
        class="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-8 gap-x-2 gap-y-1 min-h-0 content-start"
      >
        <!-- ── Fila 1 ───────────────────────────────────────────────────── -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_X_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'X'"
          [value]="blancoBolax()"
          (valueChange)="blancoBolax.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_Y_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Y'"
          [value]="blancoBolay()"
          (valueChange)="blancoBolay.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_Z_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Z'"
          [value]="blancoBolaz()"
          (valueChange)="blancoBolaz.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_X_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'X'"
          [value]="bocaPiezaX()"
          (valueChange)="bocaPiezaX.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_Y_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Y'"
          [value]="bocaPiezaY()"
          (valueChange)="bocaPiezaY.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_Z_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Z'"
          [value]="bocaPiezaZ()"
          (valueChange)="bocaPiezaZ.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.DIAMETRO_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="diametroBola()"
          (valueChange)="diametroBola.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALTURA_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="alturaBola()"
          (valueChange)="alturaBola.set($event)"
        />

        <!-- ── Fila 2 ───────────────────────────────────────────────────── -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_TRANS_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="altTripodeCamTransversal()"
          (valueChange)="altTripodeCamTransversal.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_X_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'X'"
          [value]="camaraFrontalX()"
          (valueChange)="camaraFrontalX.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_Y_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Y'"
          [value]="camaraFrontalY()"
          (valueChange)="camaraFrontalY.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_Z_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Z'"
          [value]="camaraFrontalZ()"
          (valueChange)="camaraFrontalZ.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_FRONTAL_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="altTripodeCamFrontal()"
          (valueChange)="altTripodeCamFrontal.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_X_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'X'"
          [value]="camTransversalX()"
          (valueChange)="camTransversalX.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_Y_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Y'"
          [value]="camTransversalY()"
          (valueChange)="camTransversalY.set($event)"
        />
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_Z_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'Z'"
          [value]="camTransversalZ()"
          (valueChange)="camTransversalZ.set($event)"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatosBlancoBola extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #dialog = inject(MatDialog);

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly mOptions = [{ value: 'm', label: 'm' }];

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.datosBlancoBola().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.datosBlancoBola().disparoOptions);

  // ── Estado del disparo ────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.datosBlancoBola().estadoDisparo) {
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
    switch (this.#store.datosBlancoBola().estadoDisparo) {
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

  // ── Selector form ─────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.datosBlancoBola().serie,
    disparo: this.#store.datosBlancoBola().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // ── Field signals ─────────────────────────────────────────────────────────
  protected readonly blancoBolax = signal<InputFieldValue>(this.#store.datosBlancoBola().blancoBolax);
  protected readonly blancoBolay = signal<InputFieldValue>(this.#store.datosBlancoBola().blancoBolay);
  protected readonly blancoBolaz = signal<InputFieldValue>(this.#store.datosBlancoBola().blancoBolaz);
  protected readonly bocaPiezaX = signal<InputFieldValue>(this.#store.datosBlancoBola().bocaPiezaX);
  protected readonly bocaPiezaY = signal<InputFieldValue>(this.#store.datosBlancoBola().bocaPiezaY);
  protected readonly bocaPiezaZ = signal<InputFieldValue>(this.#store.datosBlancoBola().bocaPiezaZ);
  protected readonly diametroBola = signal<InputFieldValue>(this.#store.datosBlancoBola().diametroBola);
  protected readonly alturaBola = signal<InputFieldValue>(this.#store.datosBlancoBola().alturaBola);
  protected readonly altTripodeCamTransversal = signal<InputFieldValue>(
    this.#store.datosBlancoBola().altTripodeCamTransversal,
  );
  protected readonly camaraFrontalX = signal<InputFieldValue>(this.#store.datosBlancoBola().camaraFrontalX);
  protected readonly camaraFrontalY = signal<InputFieldValue>(this.#store.datosBlancoBola().camaraFrontalY);
  protected readonly camaraFrontalZ = signal<InputFieldValue>(this.#store.datosBlancoBola().camaraFrontalZ);
  protected readonly altTripodeCamFrontal = signal<InputFieldValue>(this.#store.datosBlancoBola().altTripodeCamFrontal);
  protected readonly camTransversalX = signal<InputFieldValue>(this.#store.datosBlancoBola().camTransversalX);
  protected readonly camTransversalY = signal<InputFieldValue>(this.#store.datosBlancoBola().camTransversalY);
  protected readonly camTransversalZ = signal<InputFieldValue>(this.#store.datosBlancoBola().camTransversalZ);

  // ── Snapshot for dirty tracking ───────────────────────────────────────────
  readonly #savedSnapshot = signal(this.#currentFieldSnapshot());

  protected readonly isDirty = computed(() => {
    if (this.selectorForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return JSON.stringify(this.#currentFieldSnapshot()) !== JSON.stringify(snap);
  });

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectorForm().valid(),
    hasChanges: this.isDirty(),
  }));

  setCurrentShot(): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
  }

  openMasivaDialog(): void {
    const stored = this.#store.datosBlancoBola();
    const dialogData: AplicarConfigMasivaDialogData = {
      serieOptions: stored.serieOptions,
      disparoOptions: stored.disparoOptions,
      currentData: {
        blancoBolax: this.blancoBolax(),
        blancoBolay: this.blancoBolay(),
        blancoBolaz: this.blancoBolaz(),
        bocaPiezaX: this.bocaPiezaX(),
        bocaPiezaY: this.bocaPiezaY(),
        bocaPiezaZ: this.bocaPiezaZ(),
        diametroBola: this.diametroBola(),
        alturaBola: this.alturaBola(),
        altTripodeCamTransversal: this.altTripodeCamTransversal(),
        camaraFrontalX: this.camaraFrontalX(),
        camaraFrontalY: this.camaraFrontalY(),
        camaraFrontalZ: this.camaraFrontalZ(),
        altTripodeCamFrontal: this.altTripodeCamFrontal(),
        camTransversalX: this.camTransversalX(),
        camTransversalY: this.camTransversalY(),
        camTransversalZ: this.camTransversalZ(),
      },
    };

    const ref = this.#dialog.open<
      AplicarConfigMasivaDialog,
      AplicarConfigMasivaDialogData,
      AplicarConfigMasivaDialogResult
    >(AplicarConfigMasivaDialog, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: true,
      data: dialogData,
    });

    ref.afterClosed().subscribe((result) => {
      if (result?.action === 'apply') {
        // Apply the form values to the store (applies to all selected series/disparos)
        this.#store.updateDatosBlancoBola(result.data);
        this.#applyFieldsFromStore();
        this.#savedSnapshot.set(this.#currentFieldSnapshot());
      }
    });
  }

  resetForm(): void {
    const stored = this.#store.datosBlancoBola();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.#applyFieldsFromStore();
    this.#savedSnapshot.set(this.#currentFieldSnapshot());
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    this.#store.updateDatosBlancoBola({
      serie,
      disparo,
      blancoBolax: this.blancoBolax(),
      blancoBolay: this.blancoBolay(),
      blancoBolaz: this.blancoBolaz(),
      bocaPiezaX: this.bocaPiezaX(),
      bocaPiezaY: this.bocaPiezaY(),
      bocaPiezaZ: this.bocaPiezaZ(),
      diametroBola: this.diametroBola(),
      alturaBola: this.alturaBola(),
      altTripodeCamTransversal: this.altTripodeCamTransversal(),
      camaraFrontalX: this.camaraFrontalX(),
      camaraFrontalY: this.camaraFrontalY(),
      camaraFrontalZ: this.camaraFrontalZ(),
      altTripodeCamFrontal: this.altTripodeCamFrontal(),
      camTransversalX: this.camTransversalX(),
      camTransversalY: this.camTransversalY(),
      camTransversalZ: this.camTransversalZ(),
    });
    this.#savedSnapshot.set(this.#currentFieldSnapshot());
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  #currentFieldSnapshot() {
    return {
      blancoBolax: this.blancoBolax(),
      blancoBolay: this.blancoBolay(),
      blancoBolaz: this.blancoBolaz(),
      bocaPiezaX: this.bocaPiezaX(),
      bocaPiezaY: this.bocaPiezaY(),
      bocaPiezaZ: this.bocaPiezaZ(),
      diametroBola: this.diametroBola(),
      alturaBola: this.alturaBola(),
      altTripodeCamTransversal: this.altTripodeCamTransversal(),
      camaraFrontalX: this.camaraFrontalX(),
      camaraFrontalY: this.camaraFrontalY(),
      camaraFrontalZ: this.camaraFrontalZ(),
      altTripodeCamFrontal: this.altTripodeCamFrontal(),
      camTransversalX: this.camTransversalX(),
      camTransversalY: this.camTransversalY(),
      camTransversalZ: this.camTransversalZ(),
    };
  }

  #applyFieldsFromStore(): void {
    const stored = this.#store.datosBlancoBola();
    this.blancoBolax.set(stored.blancoBolax);
    this.blancoBolay.set(stored.blancoBolay);
    this.blancoBolaz.set(stored.blancoBolaz);
    this.bocaPiezaX.set(stored.bocaPiezaX);
    this.bocaPiezaY.set(stored.bocaPiezaY);
    this.bocaPiezaZ.set(stored.bocaPiezaZ);
    this.diametroBola.set(stored.diametroBola);
    this.alturaBola.set(stored.alturaBola);
    this.altTripodeCamTransversal.set(stored.altTripodeCamTransversal);
    this.camaraFrontalX.set(stored.camaraFrontalX);
    this.camaraFrontalY.set(stored.camaraFrontalY);
    this.camaraFrontalZ.set(stored.camaraFrontalZ);
    this.altTripodeCamFrontal.set(stored.altTripodeCamFrontal);
    this.camTransversalX.set(stored.camTransversalX);
    this.camTransversalY.set(stored.camTransversalY);
    this.camTransversalZ.set(stored.camTransversalZ);
  }
}
