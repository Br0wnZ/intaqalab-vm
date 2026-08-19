import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionComponentStore } from '../../../../+state/munition-component.store';

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
    MatSelectModule,
  ],
  template: `
    <div class="flexbg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex justify-start mt-4 gap-2">
        <mat-form-field appearance="outline" class="w-full max-w-sm" [subscriptSizing]="'dynamic'">
          <input
            id="search"
            matInput
            [formField]="filterForm.name"
            [placeholder]="'WHAREHOUSE_MANAGMENT.SEARH_LIST_PLACEHOLDER' | translate"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-select
            [placeholder]="'WHAREHOUSE_MANAGMENT.LINK.TYPE_PLACEHOLDER' | translate"
            [formField]="filterForm.munitionTypeId"
          >
            @for (opt of munitionComponentStore.items(); track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <div class="flex justify-end mt-4 gap-2">
        <button mat-stroked-button type="button" [disabled]="formModel() === defaultFormValues" (click)="clearFilter()">
          {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.FILTER.CLEAN' | translate }}
        </button>
        <button
          mat-flat-button
          type="button"
          role="button"
          [disabled]="formModel() === defaultFormValues"
          (click)="search()"
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
  readonly munitionComponentStore = inject(MunitionComponentStore);

  readonly filters = output<{ name: string; munitionTypeId: string }>();

  constructor() {
    this.munitionComponentStore.search({ pageSize: 100 });
  }

  readonly defaultFormValues = { name: '', munitionTypeId: '' };

  readonly formModel = signal<{ name: string; munitionTypeId: string }>(this.defaultFormValues);

  readonly filterForm = form(this.formModel);

  search() {
    const { name, munitionTypeId } = this.formModel();

    if (!name && !munitionTypeId) return;

    this.filters.emit({ name, munitionTypeId });
  }

  protected clearFilter() {
    this.filters.emit({ name: '', munitionTypeId: '' });
    this.formModel.set(this.defaultFormValues);
  }
}
