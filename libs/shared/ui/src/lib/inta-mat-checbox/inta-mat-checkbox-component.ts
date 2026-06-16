import { Component, input, model, signal } from '@angular/core';
import type { FormCheckboxControl } from '@angular/forms/signals';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatError, MatHint } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ui-signal-checkbox',
  imports: [MatCheckboxModule, MatIconModule, MatHint, MatError],
  template: `
    <div class="flex flex-col gap-1">
      <mat-checkbox
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onChange($event.checked)"
        (blur)="onTouched()"
      >
        @if (prefixIcon()) {
          <mat-icon class="mr-1">
            {{ prefixIcon() }}
          </mat-icon>
        }
        {{ label() }}
        @if (suffixIcon()) {
          <mat-icon class="ml-1">
            {{ suffixIcon() }}
          </mat-icon>
        }
      </mat-checkbox>
      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }
      @if (error()) {
        <mat-error>{{ error() }}</mat-error>
      }
    </div>
  `,
})
export class IntaSignalCheckboxComponent implements FormCheckboxControl {
  readonly label = input<string>('');
  readonly hint = input<string | undefined>(undefined);
  readonly prefixIcon = input<string | undefined>(undefined);
  readonly suffixIcon = input<string | undefined>(undefined);
  // @Input() hint?: string;
  // @Input() prefixIcon?: string;
  // @Input() suffixIcon?: string;

  checked = model(false);
  disabled = model(false);
  required = model(false);
  error = signal<string | null>(null);

  setValue(value: boolean) {
    this.checked.set(value);
  }

  setDisabled(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};
  onChange(value: boolean) {
    this.checked.set(value);
  }
}
