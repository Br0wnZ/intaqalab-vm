import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
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
import { IntaIconComponent } from "@intaqalab/ui";

type SeguridadTab = 'convencional' | 'alta-velocidad';

interface SeguridadSelectsModel {
  serie: string | null;
  disparo: string | null;
  pruebaCamara: string | null;
  pruebaGrabador: string | null;
  pruebaCanal: string | null;
  blancoCamara: string | null;
  blancoGrabador: string | null;
  blancoCanal: string | null;
  bocaCamara: string | null;
  bocaGrabador: string | null;
  bocaCanal: string | null;
  cierreCamara: string | null;
  cierreGrabador: string | null;
  cierreCanal: string | null;
  piqueCamara: string | null;
  piqueGrabador: string | null;
  piqueCanal: string | null;
}

@Component({
  selector: 'inta-seguridad',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent
],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-2">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
        <ui-inta-icon name="edit_line" color="var(--inta-button)" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.TITLE' | translate }}
        </h3>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- ── Serie + Disparo ─────────────────────────────────────────────── -->
      <div class="flex gap-2 shrink-0">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 small-select">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.SERIE_LABEL' | translate }}</mat-label>
          <mat-select [formField]="myForm.serie">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 small-select">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.DISPARO_LABEL' | translate }}</mat-label>
          <mat-select [formField]="myForm.disparo">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- ── Actions + Tabs ─────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          mat-flat-button
          type="button"
          class="!p-2 !h-auto"
          (click)="setCurrentShot()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CURRENT_SHOT_BTN' | translate }}
        </button>
        <div class="flex items-center gap-2 ml-auto">
          <button
            type="button"
            class="text-xs font-medium px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer"
            [class]="
              activeTab() === 'alta-velocidad'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-[var(--inta-button)]/50 text-white'
            "
            (click)="setTab('alta-velocidad')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.TAB_ALTA_VELOCIDAD' | translate }}
          </button>
          <button
            type="button"
            class="text-xs font-medium px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer"
            [class]="
              activeTab() === 'convencional'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-[var(--inta-button)]/50 text-white'
            "
            (click)="setTab('convencional')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.TAB_CONVENCIONAL' | translate }}
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t-1 border-gray-200"></div>

      <!-- ── Scrollable content ──────────────────────────────────────────── -->
      <div intaReadonlyContent class="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 pr-0.5 [&>div:not(:last-child)]:border-b-1 [&>div:not(:last-child)]:border-gray-200 [&>div:not(:last-child)]:pb-3">
        @if (activeTab() === 'convencional') {
          <!-- ── Prueba block ──────────────────────────────────────────── -->
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-3 gap-2">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CAMARA_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.pruebaCamara">
                  @for (opt of camaraOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.GRABADOR_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.pruebaGrabador">
                  @for (opt of grabadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CANAL_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.pruebaCanal">
                  @for (opt of canalOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full" class="small-textarea">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.PRUEBA_LABEL' | translate }}</mat-label>
              <textarea
                matInput
                rows="5"
                class="resize-none"
                [value]="pruebaTexto() ?? ''"
                (input)="pruebaTexto.set($any($event.target).value || null)"
              ></textarea>
            </mat-form-field>
          </div>
        }

        @if (activeTab() === 'alta-velocidad') {
          <!-- ── Blanco block ──────────────────────────────────────────── -->
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-3 gap-2">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CAMARA_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.blancoCamara">
                  @for (opt of camaraOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.GRABADOR_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.blancoGrabador">
                  @for (opt of grabadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CANAL_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.blancoCanal">
                  @for (opt of canalOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full" class="small-textarea">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.BLANCO_LABEL' | translate }}</mat-label>
              <textarea
                matInput
                rows="4"
                class="resize-none"
                [value]="blancoTexto() ?? ''"
                (input)="blancoTexto.set($any($event.target).value || null)"
              ></textarea>
            </mat-form-field>
          </div>

          <!-- ── Boca block ────────────────────────────────────────────── -->
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-3 gap-2">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CAMARA_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.bocaCamara">
                  @for (opt of camaraOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.GRABADOR_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.bocaGrabador">
                  @for (opt of grabadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CANAL_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.bocaCanal">
                  @for (opt of canalOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full" class="small-textarea">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.BOCA_LABEL' | translate }}</mat-label>
              <textarea
                matInput
                rows="4"
                class="resize-none"
                [value]="bocaTexto() ?? ''"
                (input)="bocaTexto.set($any($event.target).value || null)"
              ></textarea>
            </mat-form-field>
          </div>

          <!-- ── Cierre block ──────────────────────────────────────────── -->
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-3 gap-2">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CAMARA_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.cierreCamara">
                  @for (opt of camaraOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.GRABADOR_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.cierreGrabador">
                  @for (opt of grabadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CANAL_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.cierreCanal">
                  @for (opt of canalOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full" class="small-textarea">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CIERRE_LABEL' | translate }}</mat-label>
              <textarea
                matInput
                rows="4"
                class="resize-none"
                [value]="cierreTexto() ?? ''"
                (input)="cierreTexto.set($any($event.target).value || null)"
              ></textarea>
            </mat-form-field>
          </div>

          <!-- ── Pique block ───────────────────────────────────────────── -->
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-3 gap-2">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CAMARA_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.piqueCamara">
                  @for (opt of camaraOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.GRABADOR_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.piqueGrabador">
                  @for (opt of grabadorOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="small-select">
                <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.CANAL_LABEL' | translate }}</mat-label>
                <mat-select [formField]="myForm.piqueCanal">
                  @for (opt of canalOptions(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full" class="small-textarea">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.PIQUE_LABEL' | translate }}</mat-label>
              <textarea
                matInput
                rows="4"
                class="resize-none"
                [value]="piqueTexto() ?? ''"
                (input)="piqueTexto.set($any($event.target).value || null)"
              ></textarea>
            </mat-form-field>
          </div>
        }
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeguridadWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });

  // ── UI state ──────────────────────────────────────────────────────────────
  protected readonly activeTab = signal<SeguridadTab>('convencional');

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.seguridad().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.seguridad().disparoOptions);
  protected readonly camaraOptions = computed(() => this.#store.seguridad().camaraOptions);
  protected readonly grabadorOptions = computed(() => this.#store.seguridad().grabadorOptions);
  protected readonly canalOptions = computed(() => this.#store.seguridad().canalOptions);

  // ── Estado del disparo ────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.seguridad().estadoDisparo) {
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
    switch (this.#store.seguridad().estadoDisparo) {
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

  // ── Form model (selects) ──────────────────────────────────────────────────
  protected readonly formModel = signal<SeguridadSelectsModel>(this.#selectsFromStore());
  protected readonly myForm = form(this.formModel);

  // ── Text signals (textareas) ──────────────────────────────────────────────
  protected readonly pruebaTexto = signal<string | null>(this.#store.seguridad().prueba.texto);
  protected readonly blancoTexto = signal<string | null>(this.#store.seguridad().blanco.texto);
  protected readonly bocaTexto = signal<string | null>(this.#store.seguridad().boca.texto);
  protected readonly cierreTexto = signal<string | null>(this.#store.seguridad().cierre.texto);
  protected readonly piqueTexto = signal<string | null>(this.#store.seguridad().pique.texto);

  // ── Dirty tracking via snapshot ───────────────────────────────────────────
  readonly #savedSnapshot = signal(this.#currentSnapshot());

  protected readonly isDirty = computed(() => {
    const current = JSON.stringify(this.#currentSnapshot());
    const saved = JSON.stringify(this.#savedSnapshot());
    return current !== saved;
  });

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.myForm().valid(),
    hasChanges: this.isDirty(),
  }));

  setCurrentShot(): void {
    this.formModel.update((m) => ({
      ...m,
      serie: this.#store.activeSerieId() ?? m.serie,
      disparo: this.#store.activeShotId() ?? m.disparo,
    }));
  }

  setTab(tab: SeguridadTab): void {
    this.activeTab.set(tab);
  }

  resetForm(): void {
    this.formModel.set(this.#selectsFromStore());
    const stored = this.#store.seguridad();
    this.pruebaTexto.set(stored.prueba.texto);
    this.blancoTexto.set(stored.blanco.texto);
    this.bocaTexto.set(stored.boca.texto);
    this.cierreTexto.set(stored.cierre.texto);
    this.piqueTexto.set(stored.pique.texto);
    this.#savedSnapshot.set(this.#currentSnapshot());
  }

  async saveForm(): Promise<void> {
    const m = this.formModel();
    this.#store.updateSeguridad({
      serie: m.serie,
      disparo: m.disparo,
      prueba: { camara: m.pruebaCamara, grabador: m.pruebaGrabador, canal: m.pruebaCanal, texto: this.pruebaTexto() },
      blanco: { camara: m.blancoCamara, grabador: m.blancoGrabador, canal: m.blancoCanal, texto: this.blancoTexto() },
      boca: { camara: m.bocaCamara, grabador: m.bocaGrabador, canal: m.bocaCanal, texto: this.bocaTexto() },
      cierre: { camara: m.cierreCamara, grabador: m.cierreGrabador, canal: m.cierreCanal, texto: this.cierreTexto() },
      pique: { camara: m.piqueCamara, grabador: m.piqueGrabador, canal: m.piqueCanal, texto: this.piqueTexto() },
    });
    this.#savedSnapshot.set(this.#currentSnapshot());
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  #selectsFromStore(): SeguridadSelectsModel {
    const s = this.#store.seguridad();
    return {
      serie: s.serie,
      disparo: s.disparo,
      pruebaCamara: s.prueba.camara,
      pruebaGrabador: s.prueba.grabador,
      pruebaCanal: s.prueba.canal,
      blancoCamara: s.blanco.camara,
      blancoGrabador: s.blanco.grabador,
      blancoCanal: s.blanco.canal,
      bocaCamara: s.boca.camara,
      bocaGrabador: s.boca.grabador,
      bocaCanal: s.boca.canal,
      cierreCamara: s.cierre.camara,
      cierreGrabador: s.cierre.grabador,
      cierreCanal: s.cierre.canal,
      piqueCamara: s.pique.camara,
      piqueGrabador: s.pique.grabador,
      piqueCanal: s.pique.canal,
    };
  }

  #currentSnapshot() {
    return {
      ...this.formModel(),
      pruebaTexto: this.pruebaTexto(),
      blancoTexto: this.blancoTexto(),
      bocaTexto: this.bocaTexto(),
      cierreTexto: this.cierreTexto(),
      piqueTexto: this.piqueTexto(),
    };
  }
}
