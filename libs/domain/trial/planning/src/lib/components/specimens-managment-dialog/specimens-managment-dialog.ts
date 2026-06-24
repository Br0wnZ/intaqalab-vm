import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, disabled, form, required, submit } from '@angular/forms/signals';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { type SpecimenOption, type SpecimenSelection, SpecimenType } from '../../utils-models/specimen.model';

@Component({
  selector: 'inta-specimens-managment-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormField,
    TranslateModule,
    IntaIconComponent,
  ],
  providers: [PlanningGeneralDataStore],
  template: `
    <h2 mat-dialog-title class="flex items-center justify-center gap-2">
      <ui-inta-icon name="catalog" size="xxl" />
      {{ 'SPECIMENS_MANAGMENT_DIALOG.TITLE' | translate }}
    </h2>

    <mat-dialog-content class="!p-4">
      <form class="space-y-4">
        <div class="flex flex-col">
          <label for="specimenType" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'SPECIMENS_MANAGMENT_DIALOG.TYPE_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              id="specimenType"
              [value]="selectedSpecimenType()"
              [placeholder]="'SPECIMENS_MANAGMENT_DIALOG.TYPE_PLACEHOLDER' | translate"
              (valueChange)="onSpecimenTypeChange($event)"
            >
              @for (type of specimenTypes; track type.value) {
                <mat-option [value]="type.value">{{ type.label | translate }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Espécimen -->
        <div class="flex flex-col">
          <label for="specimenInput" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'SPECIMENS_MANAGMENT_DIALOG.SPECIMEN_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              placeholder="{{ 'SPECIMENS_MANAGMENT_DIALOG.SPECIMEN_PLACEHOLDER' | translate }}"
              id="specimenInput"
              matInput
              [value]="searchTerm()"
              [matAutocomplete]="specimenAutocomplete"
              [disabled]="isSpecimenInputDisabled()"
              [matAutocompleteDisabled]="!autocompleteEnabled()"
              (click)="openAutocomplete()"
              (input)="onSearchChange($event)"
            />
            <mat-autocomplete
              (optionSelected)="onSelectOption($event.option.value)"
              #specimenAutocomplete="matAutocomplete"
            >
              @if (filteredSpecimenOptions().length > 0) {
                @for (specimen of filteredSpecimenOptions(); track specimen.id) {
                  <mat-option [value]="specimen.id">{{ getSpecimenLabel(specimen) }}</mat-option>
                }
              }
              @if (filteredSpecimenOptions().length === 0) {
                <mat-option disabled>{{ 'SPECIMENS_MANAGMENT_DIALOG.NO_RESULTS' | translate }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
        </div>

        @if (showSerialNumberField()) {
          <div class="flex flex-col">
            <label for="serialNumberInput" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'SPECIMENS_MANAGMENT_DIALOG.SERIAL_NUMBER_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <mat-label></mat-label>
              <input
                placeholder="{{ 'SPECIMENS_MANAGMENT_DIALOG.SERIAL_NUMBER_PLACEHOLDER' | translate }}"
                id="serialNumberInput"
                matInput
                [formField]="specimenForm.serialNumber"
              />
            </mat-form-field>
          </div>
        }
        @if (showLotField()) {
          <div class="flex flex-col">
            <label for="lotInput" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'SPECIMENS_MANAGMENT_DIALOG.LOT_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                placeholder="{{ 'SPECIMENS_MANAGMENT_DIALOG.LOT_PLACEHOLDER' | translate }}"
                id="lotInput"
                matInput
                [formField]="specimenForm.lot"
              />
            </mat-form-field>
          </div>
        }
        @if (showSerialNumberField() || showLotField()) {
          <div class="flex justify-end">
            <button mat-flat-button type="button" [disabled]="!specimenForm().valid()" (click)="onAdd()">Añadir</button>
          </div>
        }
        @if (selectedSpecimens().length > 0) {
          <div class="rounded-lg border border-gray-200 bg-white">
            <div class="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">
              {{ 'SPECIMENS_MANAGMENT_DIALOG.SELECTED_TITLE' | translate }}
            </div>
            <div class="grid grid-cols-2 px-4 py-2 text-xs font-medium text-gray-600 !bg-gray-100">
              <span>{{ 'SPECIMENS_MANAGMENT_DIALOG.SELECTED_HEADER_SPECIMEN' | translate }}</span>
              <span class="text-right">{{ 'SPECIMENS_MANAGMENT_DIALOG.SELECTED_HEADER_LOT_SERIAL' | translate }}</span>
            </div>
            @for (item of selectedSpecimens(); track item.id) {
              <div class="grid grid-cols-2 items-center px-4 py-3 text-sm text-gray-700">
                <div class="flex items-center gap-2">
                  <button
                    mat-icon-button
                    type="button"
                    aria-label="{{ 'SPECIMENS_MANAGMENT_DIALOG.REMOVE_ARIA' | translate }}"
                    class="!text-gray-600 !flex scale-90"
                    (click)="removeSelection(item.id)"
                  >
                    <ui-inta-icon name="remove" size="xxl" />
                  </button>
                  <span>{{ item.label }}</span>
                </div>
                <span class="text-right">{{ item.serialNumber || item.lot || '-' }}</span>
              </div>
            }
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="p-4 space-x-2">
      <button mat-flat-button color="primary" [disabled]="!hasChanges()" (click)="onSave()">
        {{ 'SPECIMENS_MANAGMENT_DIALOG.SAVE' | translate }}
      </button>
      <button mat-stroked-button (click)="onCancel()">
        {{ 'SPECIMENS_MANAGMENT_DIALOG.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecimensManagmentDialog {
  readonly autocompleteTrigger = viewChild(MatAutocompleteTrigger);

  readonly #dialogRef = inject(MatDialogRef<SpecimensManagmentDialog>);
  readonly #dialogData = inject<{
    fireTrialId?: string | null;
    selectedSpecimens?: { specimenId: string; batch: string }[];
  } | null>(MAT_DIALOG_DATA, { optional: true });
  readonly store = inject(PlanningGeneralDataStore);

  readonly specimens = computed(() => this.store.typedSpecimens());

  readonly specimenTypes = [
    { value: SpecimenType.Weapon, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_WEAPON' },
    { value: SpecimenType.Tube, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_TUBE' },
    { value: SpecimenType.Munition, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_MUNITION' },
  ] as const;

  constructor() {
    this.#watchInitialData();
  }

  readonly selectedSpecimenType = signal<SpecimenType | null>(null);
  readonly formModel = signal({ specimenId: '', serialNumber: '', lot: '' });

  readonly specimenForm = form(this.formModel, (f) => {
    required(f.specimenId);
    disabled(f.serialNumber, () => !this.formModel().specimenId);
    disabled(f.lot, () => !this.formModel().specimenId);
  });

  readonly searchTerm = signal('');
  readonly autocompleteEnabled = signal(false);
  readonly selectedSpecimens = signal<SpecimenSelection[]>([]);
  readonly #initialSpecimens = signal<SpecimenSelection[]>([]);
  readonly #initialized = signal(false);

  readonly isSpecimenInputDisabled = computed(
    () =>
      this.selectedSpecimenType() === null ||
      this.store.isLoadingTypedSpecimens() ||
      Boolean(this.store.typedSpecimensError()),
  );

  readonly selectedOption = computed(() => {
    const id = this.formModel().specimenId;
    return this.specimens().find((s) => s.id === id) ?? null;
  });

  readonly filteredSpecimenOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const selectedType = this.selectedSpecimenType();
    if (!selectedType) return [];

    return this.specimens().filter((s) => {
      const type = this.#getUiType(s);
      return type === selectedType && this.getSpecimenLabel(s).toLowerCase().includes(term);
    });
  });

  readonly showSerialNumberField = computed(() => {
    const type = this.#getUiType(this.selectedOption());
    return type === 'weapon' || type === 'tube';
  });

  readonly showLotField = computed(() => this.#getUiType(this.selectedOption()) === 'denomination');

  readonly hasChanges = computed(() => {
    const current = this.selectedSpecimens();
    const initial = this.#initialSpecimens();

    if (current.length !== initial.length) return true;

    return current.some((c) => {
      const i = initial.find((item) => item.id === c.id);
      if (!i) return true;
      return c.serialNumber !== i.serialNumber || c.lot !== i.lot;
    });
  });

  async onAdd() {
    await submit(this.specimenForm, async () => {
      const selected = this.selectedOption();
      if (!selected) return;

      const entry: SpecimenSelection = {
        id: selected.id,
        label: this.getSpecimenLabel(selected),
        type: selected.type ?? SpecimenType.Munition,
        serialNumber: this.formModel().serialNumber.trim() || undefined,
        lot: this.formModel().lot.trim() || undefined,
      };

      this.selectedSpecimens.update((list) => {
        const filtered = list.filter((i) => i.id !== entry.id);
        return [...filtered, entry];
      });
      this.resetSelection();
    });
  }

  onSave(): void {
    this.#dialogRef.close(
      this.selectedSpecimens().map((i) => ({ specimenId: i.id, batch: i.serialNumber || i.lot || '' })),
    );
  }

  onSearchChange(event: Event): void {
    if (this.isSpecimenInputDisabled()) return;
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.autocompleteEnabled.set(true);
    this.formModel.update((c) => ({ ...c, specimenId: '', serialNumber: '', lot: '' }));
  }

  onSpecimenTypeChange(specimenType: SpecimenType | null): void {
    this.selectedSpecimenType.set(specimenType);
    this.resetSelection();
    if (!specimenType) return;
    this.store.loadSpecimensByType(specimenType);
  }

  onSelectOption(specimenId: string): void {
    const selected = this.specimens().find((s) => s.id === specimenId);
    this.searchTerm.set(selected ? this.getSpecimenLabel(selected) : '');
    this.autocompleteEnabled.set(false);

    const isDenomination = this.#getUiType(selected) === 'denomination';
    this.formModel.update((c) => ({
      ...c,
      specimenId,
      serialNumber: isDenomination ? '' : c.serialNumber,
      lot: isDenomination ? c.lot : '',
    }));
  }

  removeSelection(id: string): void {
    this.selectedSpecimens.update((list) => list.filter((i) => i.id !== id));
  }

  openAutocomplete(): void {
    if (this.isSpecimenInputDisabled()) return;
    this.autocompleteEnabled.set(true);
    queueMicrotask(() => this.autocompleteTrigger()?.openPanel());
  }

  resetSelection(): void {
    this.formModel.update((c) => ({ ...c, specimenId: '', serialNumber: '', lot: '' }));
    this.searchTerm.set('');
    this.autocompleteEnabled.set(false);
  }

  onCancel(): void {
    this.#dialogRef.close();
  }

  getSpecimenLabel(specimen: SpecimenOption): string {
    if (specimen.label) return specimen.label;
    if (typeof specimen.name === 'string') return specimen.name;
    return specimen.name?.es || specimen.name?.en || specimen.id;
  }

  #getUiType(specimen: SpecimenOption | null | undefined): SpecimenType {
    if (!specimen) return SpecimenType.Munition;
    const normalized = (specimen.type ?? 'denomination').toString().toUpperCase();
    if (normalized === 'WEAPON') return SpecimenType.Weapon;
    if (normalized === 'TUBE') return SpecimenType.Tube;
    return SpecimenType.Munition;
  }

  #watchInitialData(): void {
    effect(() => {
      if (this.#initialized()) return;

      const specimensList = this.specimens();
      if (!specimensList.length) return;

      this.#initialized.set(true);

      const initialSelections = this.#dialogData?.selectedSpecimens ?? [];
      if (!initialSelections.length) return;

      const selections = initialSelections
        .map((s) => {
          const specimen = specimensList.find((sp) => sp.id === s.specimenId);
          if (!specimen) return null;

          const type = this.#getUiType(specimen);
          const batch = s.batch?.trim() ?? '';

          return {
            id: specimen.id,
            label: this.getSpecimenLabel(specimen),
            type: specimen.type ?? SpecimenType.Munition,
            ...(batch && (type === 'denomination' ? { lot: batch } : { serialNumber: batch })),
          } as SpecimenSelection;
        })
        .filter((s): s is SpecimenSelection => Boolean(s));

      if (selections.length) {
        this.selectedSpecimens.set(selections);
        this.#initialSpecimens.set(structuredClone(selections));
      }
    });
  }
}
