import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Botón de guardar con feedback visual inline durante mutaciones.
 *
 * Cuando `isSaving` es true:
 * - Muestra un MatSpinner de 16px en lugar del slot de icono
 * - Se deshabilita para prevenir doble-click
 * - Cambia la opacidad del label para indicar estado de espera
 *
 * Uso:
 * ```html
 * <ui-save-button
 *   [isSaving]="updateResource.isLoading()"
 *   (save)="onSave()"
 * />
 * ```
 *
 * Con label personalizado:
 * ```html
 * <ui-save-button
 *   label="UI.SAVE_BUTTON.VALIDATE"
 *   [isSaving]="validateResource.isLoading()"
 *   (save)="onValidate()"
 * />
 * ```
 */
@Component({
  selector: 'ui-save-button',
  imports: [MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, TranslateModule],
  template: `
    <button
      mat-flat-button
      type="button"
      class="save-btn"
      [disabled]="isSaving() || isDisabled()"
      [attr.aria-busy]="isSaving()"
      [matTooltip]="isSaving() ? ('UI.SAVE_BUTTON.SAVING_TOOLTIP' | translate) : ''"
      (click)="save.emit()"
    >
      @if (isSaving()) {
        <mat-spinner diameter="16" class="save-btn__spinner" />
      }
      <span [class.save-btn__label--saving]="isSaving()">
        {{ label() | translate }}
      </span>
    </button>
  `,
  styles: `
    ui-save-button {
      display: inline-block;
    }

    .save-btn {
      background-color: var(--inta-button, #7f56d9) !important;
      color: #fff !important;
      gap: 8px;
      min-width: 100px;
      transition: opacity 0.2s ease;
    }

    .save-btn:disabled {
      opacity: 0.75 !important;
    }

    .save-btn__spinner {
      --mdc-circular-progress-active-indicator-color: #fff;
      flex-shrink: 0;
    }

    .save-btn__label--saving {
      opacity: 0.7;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveButton {
  /** Clave i18n del label. Por defecto 'UI.SAVE_BUTTON.LABEL' */
  readonly label = input<string>('UI.SAVE_BUTTON.LABEL');

  /** true mientras la petición PUT/POST está en vuelo */
  readonly isSaving = input.required<boolean>();

  /** Boleano para deshabilitar botón. Por defecto false */
  readonly isDisabled = input<boolean>(false);

  /** Emitido al hacer click (solo cuando no está guardando) */
  readonly save = output<void>();
}
