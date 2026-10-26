import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { ShotFormLock } from './shot-form-lock';

/**
 * ✏️ Botón minimalista de edición histórica (icono de lápiz).
 *
 * Se muestra únicamente cuando el disparo actual permite habilitar edición (`canEnableHistoricalEdit`).
 */
@Component({
  selector: 'inta-shot-edit-button',
  imports: [MatButtonModule, MatTooltipModule, TranslateModule, IntaIconComponent],
  template: `
    @if (canEdit()) {
      <button
        mat-icon-button
        type="button"
        [matTooltip]="'COMMONS.EDIT' | translate"
        [attr.aria-label]="'COMMONS.EDIT' | translate"
        (click)="onEdit()"
      >
        <ui-inta-icon name="edit_line" color="var(--inta-button)" />
      </button>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShotEditButton {
  readonly lock = input<ShotFormLock | null>(null);
  readonly canEnable = input<boolean | null>(null);
  readonly edit = output<void>();

  protected readonly canEdit = computed(() => {
    const overrideVal = this.canEnable();
    if (overrideVal !== null && overrideVal !== undefined) {
      return Boolean(overrideVal);
    }
    return this.lock()?.canEnableHistoricalEdit() ?? false;
  });

  onEdit(): void {
    this.lock()?.enableHistoricalEdit();
    this.edit.emit();
  }
}
