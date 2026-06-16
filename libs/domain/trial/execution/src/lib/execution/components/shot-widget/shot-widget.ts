import { Component, computed, inject, input, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

/**
 * 🎯 Widget de Disparo con formulario
 */
@Component({
  selector: 'inta-shot-widget',
  imports: [
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    FormField,
    ReadonlyContentDirective,
  ],
  host: { class: 'block h-full' },
  template: `
    <mat-card class="h-full !shadow-none border border-gray-100 flex flex-col bg-white">
      <mat-card-header class="!p-3 shrink-0">
        <mat-card-title class="!text-[13px] !font-bold flex items-center gap-2 text-gray-800">
          <mat-icon class="scale-75 text-purple-600">settings_input_component</mat-icon>
          {{ 'WIDGETS.SHOT.TITLE' | translate }}
          @if (formState().dirty) {
            <span class="w-2 h-2 rounded-full bg-orange-500 ml-1"></span>
          }
        </mat-card-title>
      </mat-card-header>

      <mat-card-content intaReadonlyContent class="flex-1 px-4 pb-4 overflow-hidden">
        <!-- Layout dinámico basado en el ancho -->
        <div [class]="width() === 1 ? 'flex flex-col gap-2' : 'grid grid-cols-12 gap-x-4 gap-y-1'">
          <!-- Número de Disparo -->
          <div [class]="width() === 1 ? '' : 'col-span-6 lg:col-span-4'">
            <label for="shot-number" class="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block tracking-wider">
              {{ 'WIDGETS.SHOT.NUMBER' | translate }}
            </label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <input placeholder="Ej: 001" id="shot-number" matInput type="number" [formField]="shotForm.shotNumber" />
            </mat-form-field>
          </div>

          <!-- Velocidad -->
          <div [class]="width() === 1 ? '' : 'col-span-6 lg:col-span-4'">
            <label
              for="shot-velocity"
              class="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block tracking-wider"
            >
              {{ 'WIDGETS.SHOT.VELOCITY' | translate }} (m/s)
            </label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <input placeholder="Ej: 850" id="shot-velocity" matInput type="number" [formField]="shotForm.velocity" />
            </mat-form-field>
          </div>

          <!-- Observaciones -->
          <div [class]="width() === 1 ? '' : 'col-span-12 lg:col-span-4'">
            <label
              for="shot-observations"
              class="text-[10px] font-bold text-gray-400 uppercase mb-0.5 block tracking-wider"
            >
              {{ 'WIDGETS.SHOT.OBSERVATIONS' | translate }}
            </label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <textarea
                placeholder="..."
                id="shot-observations"
                matInput
                [rows]="width() === 1 ? 1 : width() === 3 ? 1 : 2"
                [formField]="shotForm.observations"
              ></textarea>
            </mat-form-field>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class ShotWidgetComponent extends BaseFormWidgetComponent {
  // 🆔 ID del widget (pasado desde el padre)
  readonly widgetId = input.required<string>();

  // 💉 Inyección de dependencias
  override readonly widgetStateService = inject(WidgetStateService);

  /**
   * 📐 Computed: Ancho actual del widget en el grid
   */
  readonly width = computed(() => {
    const widgets = this.widgetStateService.placedWidgets();
    const current = widgets.find((w) => w.id === this.widgetId());
    return current?.width ?? 1;
  });

  // 📊 Modelo del formulario
  readonly shotModel = signal({
    shotNumber: '',
    velocity: '',
    observations: '',
  });

  // 📝 Formulario con validaciones
  readonly shotForm = form(this.shotModel, (f) => {
    required(f.shotNumber);
    required(f.velocity);

    validate(f.velocity, ({ value }) => {
      const numValue = parseFloat(value());
      if (isNaN(numValue) || numValue < 0) {
        return { kind: 'invalidVelocity', message: 'La velocidad debe ser un número positivo' };
      }
      return null;
    });
  });

  /**
   * 📊 Computed: Estado del formulario
   */
  readonly formState = computed((): WidgetFormState => {
    return {
      widgetId: this.widgetId(),
      dirty: this.shotForm().dirty(),
      touched: this.shotForm().touched(),
      valid: this.shotForm().valid(),
      hasChanges: this.shotForm().dirty(),
    };
  });

  /**
   * 🔄 Resetear formulario
   */
  resetForm(): void {
    this.shotModel.set({
      shotNumber: '',
      velocity: '',
      observations: '',
    });
  }

  /**
   * 💾 Guardar formulario
   */
  async saveForm(): Promise<void> {
    if (!this.shotForm().valid()) {
      return;
    }

    const data = this.shotModel();
    console.log('Guardando shot:', data);

    // Aquí harías la llamada al servicio
    // await this.shotService.save(data);

    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log('Shot guardado exitosamente');
  }
}
