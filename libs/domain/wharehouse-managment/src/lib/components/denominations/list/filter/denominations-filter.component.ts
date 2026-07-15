import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { DenominationsStore } from '../../../../+state/denominations.store';

@Component({
  selector: 'inta-denominations-filter',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FormField,
  ],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <mat-form-field appearance="outline" class="w-full max-w-sm" [subscriptSizing]="'dynamic'">
        <input
          id="search"
          matInput
          [formField]="filterForm.name"
          [placeholder]="'WHAREHOUSE_MANAGMENT.SEARH_LIST_PLACEHOLDER' | translate"
        />
      </mat-form-field>
      <div class="flex justify-end mt-4 gap-2">
        <button
          mat-stroked-button
          type="button"
          [disabled]="formModel().name === defaultFormValues.name"
          (click)="clearFilter()"
        >
          {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN' | translate }}
        </button>
        <button
          mat-flat-button
          type="button"
          role="button"
          [disabled]="formModel().name === defaultFormValues.name"
          (click)="searchByName()"
        >
          {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.SEARCH' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DenominationsFilter {
  readonly #store = inject(DenominationsStore);

  readonly defaultFormValues = { name: '' };

  readonly formModel = signal<{ name: string }>(this.defaultFormValues);

  readonly filterForm = form(this.formModel);

  searchByName() {
    const name = this.formModel().name;

    if (!name) return;

    this.#store.search({ name });
  }

  protected clearFilter() {
    this.#store.search({});
    this.formModel.set(this.defaultFormValues);
  }
}
