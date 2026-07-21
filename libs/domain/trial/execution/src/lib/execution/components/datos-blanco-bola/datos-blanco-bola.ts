import type { Signal } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent, SoundLevelMeterInput, type SoundLevelMeterValue } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { InputFieldValue } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
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
    SoundLevelMeterInput,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-2.5 flex flex-col gap-1.5 overflow-hidden">
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
        class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-2 items-end content-start min-h-0 mt-4 pt-2.5 pb-2 overflow-hidden"
      >
        <!-- Blanco bola Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BLANCO_BOLA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [disabled]="readOnly()"
          [value]="blancoBolaPosition()"
          (valueChange)="blancoBolaPosition.set($event)"
        />

        <!-- Boca pieza Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.BOCA_PIEZA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [disabled]="readOnly()"
          [value]="bocaPiezaPosition()"
          (valueChange)="bocaPiezaPosition.set($event)"
        />

        <!-- Diámetro de la bola -->
        <ui-input-select
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.DIAMETRO_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="diametroBola()"
          (valueChange)="diametroBola.set($event)"
        />

        <!-- Altura de la bola -->
        <ui-input-select
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALTURA_BOLA_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="alturaBola()"
          (valueChange)="alturaBola.set($event)"
        />

        <!-- Alt. trípode cám. trans. -->
        <ui-input-select
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_TRANS_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="altTripodeCamTransversal()"
          (valueChange)="altTripodeCamTransversal.set($event)"
        />

        <!-- Cámara frontal Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAMARA_FRONTAL_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [disabled]="readOnly()"
          [value]="camaraFrontalPosition()"
          (valueChange)="camaraFrontalPosition.set($event)"
        />

        <!-- Alt. trípode cám. frontal -->
        <ui-input-select
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.ALT_TRIPODE_CAM_FRONTAL_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'XXX'"
          [value]="altTripodeCamFrontal()"
          (valueChange)="altTripodeCamFrontal.set($event)"
        />

        <!-- Cámara transversal Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.CAM_TRANSVERSAL_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [disabled]="readOnly()"
          [value]="camTransversalPosition()"
          (valueChange)="camTransversalPosition.set($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      inta-datos-blanco-bola ui-sound-level-meter-input {
        width: 100%;
      }
      inta-datos-blanco-bola ui-sound-level-meter-input .flex {
        gap: 0.25rem !important;
        padding-left: 0.375rem !important;
        padding-right: 0.375rem !important;
      }
      inta-datos-blanco-bola ui-sound-level-meter-input input {
        max-width: 2rem;
      }
    `,
  ],
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

  // ── ReadOnly State ─────────────────────────────────────────────────────────
  protected readonly readOnly = computed(() => this.#store.isTrialReadOnly());

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

  // ── Position signals ──────────────────────────────────────────────────────
  protected readonly blancoBolaPosition = signal<SoundLevelMeterValue | null>(null);
  protected readonly bocaPiezaPosition = signal<SoundLevelMeterValue | null>(null);
  protected readonly camaraFrontalPosition = signal<SoundLevelMeterValue | null>(null);
  protected readonly camTransversalPosition = signal<SoundLevelMeterValue | null>(null);

  // ── Single field signals ──────────────────────────────────────────────────
  protected readonly diametroBola = signal<InputFieldValue>(null);
  protected readonly alturaBola = signal<InputFieldValue>(null);
  protected readonly altTripodeCamTransversal = signal<InputFieldValue>(null);
  protected readonly altTripodeCamFrontal = signal<InputFieldValue>(null);

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

  constructor() {
    super();
    this.#applyFieldsFromStore();
    this.#savedSnapshot.set(this.#currentFieldSnapshot());
  }

  setCurrentShot(): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
  }

  openMasivaDialog(): void {
    const stored = this.#store.datosBlancoBola();
    const blancoBola = this.#fromPosition(this.blancoBolaPosition());
    const bocaPieza = this.#fromPosition(this.bocaPiezaPosition());
    const camaraFrontal = this.#fromPosition(this.camaraFrontalPosition());
    const camTransversal = this.#fromPosition(this.camTransversalPosition());

    const dialogData: AplicarConfigMasivaDialogData = {
      serieOptions: stored.serieOptions,
      disparoOptions: stored.disparoOptions,
      currentData: {
        blancoBolax: blancoBola.x,
        blancoBolay: blancoBola.y,
        blancoBolaz: blancoBola.z,
        bocaPiezaX: bocaPieza.x,
        bocaPiezaY: bocaPieza.y,
        bocaPiezaZ: bocaPieza.z,
        diametroBola: this.diametroBola(),
        alturaBola: this.alturaBola(),
        altTripodeCamTransversal: this.altTripodeCamTransversal(),
        camaraFrontalX: camaraFrontal.x,
        camaraFrontalY: camaraFrontal.y,
        camaraFrontalZ: camaraFrontal.z,
        altTripodeCamFrontal: this.altTripodeCamFrontal(),
        camTransversalX: camTransversal.x,
        camTransversalY: camTransversal.y,
        camTransversalZ: camTransversal.z,
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
    const blancoBola = this.#fromPosition(this.blancoBolaPosition());
    const bocaPieza = this.#fromPosition(this.bocaPiezaPosition());
    const camaraFrontal = this.#fromPosition(this.camaraFrontalPosition());
    const camTransversal = this.#fromPosition(this.camTransversalPosition());

    this.#store.updateDatosBlancoBola({
      serie,
      disparo,
      blancoBolax: blancoBola.x,
      blancoBolay: blancoBola.y,
      blancoBolaz: blancoBola.z,
      bocaPiezaX: bocaPieza.x,
      bocaPiezaY: bocaPieza.y,
      bocaPiezaZ: bocaPieza.z,
      diametroBola: this.diametroBola(),
      alturaBola: this.alturaBola(),
      altTripodeCamTransversal: this.altTripodeCamTransversal(),
      camaraFrontalX: camaraFrontal.x,
      camaraFrontalY: camaraFrontal.y,
      camaraFrontalZ: camaraFrontal.z,
      altTripodeCamFrontal: this.altTripodeCamFrontal(),
      camTransversalX: camTransversal.x,
      camTransversalY: camTransversal.y,
      camTransversalZ: camTransversal.z,
    });
    this.#savedSnapshot.set(this.#currentFieldSnapshot());
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  #toPosition(x: InputFieldValue, y: InputFieldValue, z: InputFieldValue): SoundLevelMeterValue | null {
    const unit = x?.unit ?? y?.unit ?? z?.unit ?? 'm';
    return {
      x: x?.value ? parseFloat(x.value) : null,
      y: y?.value ? parseFloat(y.value) : null,
      z: z?.value ? parseFloat(z.value) : null,
      unit,
    };
  }

  #fromPosition(pos: SoundLevelMeterValue | null): { x: InputFieldValue; y: InputFieldValue; z: InputFieldValue } {
    if (!pos) {
      return { x: null, y: null, z: null };
    }
    const unit = pos.unit ?? 'm';
    return {
      x: pos.x !== null ? { value: pos.x.toString(), unit } : null,
      y: pos.y !== null ? { value: pos.y.toString(), unit } : null,
      z: pos.z !== null ? { value: pos.z.toString(), unit } : null,
    };
  }

  #currentFieldSnapshot() {
    return {
      blancoBolaPosition: this.blancoBolaPosition(),
      bocaPiezaPosition: this.bocaPiezaPosition(),
      camaraFrontalPosition: this.camaraFrontalPosition(),
      camTransversalPosition: this.camTransversalPosition(),
      diametroBola: this.diametroBola(),
      alturaBola: this.alturaBola(),
      altTripodeCamTransversal: this.altTripodeCamTransversal(),
      altTripodeCamFrontal: this.altTripodeCamFrontal(),
    };
  }

  #applyFieldsFromStore(): void {
    const stored = this.#store.datosBlancoBola();
    this.blancoBolaPosition.set(this.#toPosition(stored.blancoBolax, stored.blancoBolay, stored.blancoBolaz));
    this.bocaPiezaPosition.set(this.#toPosition(stored.bocaPiezaX, stored.bocaPiezaY, stored.bocaPiezaZ));
    this.camaraFrontalPosition.set(
      this.#toPosition(stored.camaraFrontalX, stored.camaraFrontalY, stored.camaraFrontalZ),
    );
    this.camTransversalPosition.set(
      this.#toPosition(stored.camTransversalX, stored.camTransversalY, stored.camTransversalZ),
    );

    this.diametroBola.set(stored.diametroBola);
    this.alturaBola.set(stored.alturaBola);
    this.altTripodeCamTransversal.set(stored.altTripodeCamTransversal);
    this.altTripodeCamFrontal.set(stored.altTripodeCamFrontal);
  }
}
