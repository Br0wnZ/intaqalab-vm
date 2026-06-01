import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'inta-wharehouse-filter',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatSlideToggleModule,
    FormField,
  ],
  template: `
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <mat-form-field appearance="outline" class="w-full max-w-sm" [subscriptSizing]="'dynamic'">
        <input
          id="search"
          matInput
          [formField]="filterForm.name"
          [placeholder]="placeholdeTranslation() || 'WHAREHOUSE_MANAGMENT.SEARH_LIST_PLACEHOLDER' | translate"
        />
      </mat-form-field>
      <div class="flex justify-end mt-4 gap-2">
        <button mat-flat-button type="button" role="button" [disabled]="disabledSearch" (click)="searchByName()">
          {{ 'COMMONS.SEARCH' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WharehouseFilterComponent {
  placeholdeTranslation = input.required<string>();
  searchItems = output<{ name: string }>();
  readonly formModel = signal<{ name: string }>({
    name: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  readonly filterForm = form(this.formModel, (f) => {});

  get disabledSearch() {
    return this.filterForm.name().controlValue() === '';
  }

  searchByName() {
    console.log('searchingw666776');
    const name = this.filterForm.name().controlValue();

    if (name !== '') {
      this.searchItems.emit({ name });
    }
  }
}
