import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { InputSelect } from '@intaqalab/ui';
import type { TargetDataState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

type InputFieldValue = { value: string; unit: string } | null;

interface TargetDataFormModel {
  blanco: string | null;
  material: string | null;
  dimensiones: string | null;
}

@Component({
  selector: 'inta-target-data',
  standalone: true,
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
  ],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-2 flex flex-col gap-1.5">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0">

        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 shrink-0">
            <mat-icon class="text-violet-600 !text-[16px] !w-[16px] !h-[16px]">description</mat-icon>
          </div>
          <h3 class="text-xs font-semibold text-slate-800 leading-tight whitespace-nowrap">
            {{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.SERIE_PLACEHOLDER' | translate"
            [value]="serieModel()"
            [disabled]="serieDisabled()"
            (selectionChange)="serieModel.set($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DISPARO_PLACEHOLDER' | translate"
            [value]="disparoModel()"
            [disabled]="disparoDisabled()"
            (selectionChange)="disparoModel.set($event.value)"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

      </div>

      <!-- Divider -->
      <div class="h-px bg-slate-100 shrink-0"></div>

      <!-- ── Fields ───────────────────────────────────────────────────────── -->
      <div intaReadonlyContent class="flex-1 grid grid-cols-3 gap-x-3 gap-y-1 min-h-0 content-start">

        <!-- Row 1 -->

        <!-- Blanco -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.BLANCO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.BLANCO_PLACEHOLDER' | translate"
            [formField]="selectForm.blanco"
          >
            @for (opt of blancoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Material -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.MATERIAL_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.MATERIAL_PLACEHOLDER' | translate"
            [formField]="selectForm.material"
          >
            @for (opt of materialOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Dimensiones -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DIMENSIONES_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DIMENSIONES_PLACEHOLDER' | translate"
            [formField]="selectForm.dimensiones"
          >
            @for (opt of dimensionesOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Row 2 -->

        <!-- Espesor -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.ESPESOR_LABEL' | translate"
          [opciones]="mmOptions"
          [value]="espesorField()"
          (valueChange)="espesorField.set($event)"
        />

        <!-- Distancia -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DISTANCIA_LABEL' | translate"
          [opciones]="mOptions"
          [value]="distanciaField()"
          (valueChange)="distanciaField.set($event)"
        />

        <!-- Inclinación -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.INCLINACION_LABEL' | translate"
          [opciones]="degOptions"
          [value]="inclinacionField()"
          (valueChange)="inclinacionField.set($event)"
        />

      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetDataWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  protected readonly mmOptions  = [{ value: 'mm',  label: 'mm'  }];
  protected readonly mOptions   = [{ value: 'm',   label: 'm'   }];
  protected readonly degOptions = [{ value: 'º',   label: 'º'   }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions      = computed(() => this.#store.targetData().serieOptions);
  protected readonly disparoOptions    = computed(() => this.#store.targetData().disparoOptions);
  protected readonly blancoOptions     = computed(() => this.#store.targetData().blancoOptions);
  protected readonly materialOptions   = computed(() => this.#store.targetData().materialOptions);
  protected readonly dimensionesOptions = computed(() => this.#store.targetData().dimensionesOptions);

  protected readonly serieDisabled   = computed(() => this.#store.targetData().sameDataAcrossSeries);
  protected readonly disparoDisabled = computed(() =>
    this.#store.targetData().sameDataAcrossSeries || this.#store.targetData().sameDataAcrossDisparos,
  );

  // ── Serie / Disparo plain signals (support [disabled]) ───────────────────
  protected readonly serieModel   = signal<string | null>(this.#store.targetData().serie);
  protected readonly disparoModel = signal<string | null>(this.#store.targetData().disparo);

  // ── Select form (Signal Forms — content fields only) ──────────────────────
  protected readonly formModel = signal<TargetDataFormModel>({
    blanco:     this.#store.targetData().blanco,
    material:   this.#store.targetData().material,
    dimensiones: this.#store.targetData().dimensiones,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Field signals ──────────────────────────────────────────────────────────
  protected readonly espesorField = signal<InputFieldValue>(
    this.#numToField(this.#store.targetData().espesor, this.#store.targetData().espesorUnit),
  );
  protected readonly distanciaField = signal<InputFieldValue>(
    this.#numToField(this.#store.targetData().distancia, this.#store.targetData().distanciaUnit),
  );
  protected readonly inclinacionField = signal<InputFieldValue>(
    this.#numToField(this.#store.targetData().inclinacion, this.#store.targetData().inclinacionUnit),
  );

  readonly #savedSnapshot = signal({
    serie:      this.serieModel(),
    disparo:    this.disparoModel(),
    espesor:    this.espesorField(),
    distancia:  this.distanciaField(),
    inclinacion: this.inclinacionField(),
  });

  protected readonly isDirty = computed(() => {
    if (this.selectForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      this.serieModel()   !== snap.serie   ||
      this.disparoModel() !== snap.disparo ||
      JSON.stringify(this.espesorField())    !== JSON.stringify(snap.espesor)    ||
      JSON.stringify(this.distanciaField())  !== JSON.stringify(snap.distancia)  ||
      JSON.stringify(this.inclinacionField()) !== JSON.stringify(snap.inclinacion)
    );
  });

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId:   this.widgetId(),
    dirty:      this.isDirty(),
    touched:    this.isDirty(),
    valid:      this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  resetForm(): void {
    const stored = this.#store.targetData();
    this.serieModel.set(stored.serie);
    this.disparoModel.set(stored.disparo);
    this.formModel.set({
      blanco:     stored.blanco,
      material:   stored.material,
      dimensiones: stored.dimensiones,
    });
    this.espesorField.set(this.#numToField(stored.espesor, stored.espesorUnit));
    this.distanciaField.set(this.#numToField(stored.distancia, stored.distanciaUnit));
    this.inclinacionField.set(this.#numToField(stored.inclinacion, stored.inclinacionUnit));
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { blanco, material, dimensiones } = this.formModel();
    const updates: Partial<TargetDataState> = {
      serie:    this.serieModel(),
      disparo:  this.disparoModel(),
      blanco,
      material,
      dimensiones,
      espesor:      this.#parseNum(this.espesorField()),
      espesorUnit:  this.espesorField()?.unit ?? 'mm',
      distancia:    this.#parseNum(this.distanciaField()),
      distanciaUnit: this.distanciaField()?.unit ?? 'm',
      inclinacion:  this.#parseNum(this.inclinacionField()),
      inclinacionUnit: this.inclinacionField()?.unit ?? 'º',
    };
    this.#store.updateTargetData(updates);
    this.#syncSnapshot();
  }

  #numToField(num: number | null, unit: string): InputFieldValue {
    if (num === null) return null;
    return { value: num.toString(), unit };
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field?.value) return null;
    const parsed = Number(field.value);
    return isNaN(parsed) ? null : parsed;
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      serie:      this.serieModel(),
      disparo:    this.disparoModel(),
      espesor:    this.espesorField(),
      distancia:  this.distanciaField(),
      inclinacion: this.inclinacionField(),
    });
  }
}
