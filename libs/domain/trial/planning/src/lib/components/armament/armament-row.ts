import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent, MatSelectClearable } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ArmamentStore } from '../../+state/armament.store';
import type { ArmamentSerieShot, ArmamentSerieShotDetail } from '../../utils-models/armament.model';
import { SpecimenType } from '../../utils-models/specimen.model';
import { ArmamentDialogService } from './armament-dialog.service';
import { mergeCatalogOptions } from './armament.mapper';

export type ShotFormPath = FieldTree<ArmamentSerieShot>;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'tr[inta-armament-row]',
  imports: [
    MatSelectModule,
    MatSelectClearable,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormField,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <!-- Shot Column -->
    <td class="py-2 px-6 text-gray-700 font-medium">{{ shotIndex() }}</td>

    <!-- Type Column -->
    <td class="py-2 px-1">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-select clearable [formField]="formPath().armament.weaponType" (valueChange)="onWeaponTypeChange($event)">
          @for (option of typeOptions; track option.value) {
            <mat-option [value]="option.value">{{ option.label | translate }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </td>

    <!-- Weapon Column -->
    <td class="py-2 px-1">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-select
          clearable
          [formField]="formPath().armament.weaponExternalId"
          (valueChange)="onWeaponChange($event)"
          (openedChange)="onWeaponSelectOpenedChange($event)"
        >
          <div
            role="search"
            class="weapon-search-container"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <mat-icon class="weapon-search-icon">search</mat-icon>
            <input
              matInput
              class="weapon-search-input"
              [placeholder]="'COMMONS.SEARCH' | translate"
              [value]="weaponSearchTerm()"
              (input)="onWeaponSearchInput($any($event.target).value)"
              (click)="$event.stopPropagation()"
              (keydown)="$event.stopPropagation()"
            />
          </div>
          @for (weapon of filteredWeaponOptions(); track weapon.id) {
            <mat-option [value]="weapon.id">{{ weapon.name }}</mat-option>
          }
          @if (filteredWeaponOptions().length === 0) {
            <mat-option disabled>{{ 'COMMONS.NO_RESULTS' | translate }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </td>

    <!-- Tube Column -->
    <td class="py-2 px-1">
      @if (shot().armament.weaponType.toLowerCase() !== mortarType) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-select clearable [formField]="formPath().armament.tubeExternalId">
            @for (tube of tubeOptions(); track tube.id) {
              <mat-option [value]="tube.denominationId?.toString() ?? tube.id">
                {{ tube.modelName ?? tube.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    </td>

    <!-- Instrumented Column -->
    <td class="py-2 px-1">
      @if (shot().armament.weaponType.toLowerCase() !== mortarType) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="max-w-20">
          <mat-select clearable [formField]="formPath().armament.isInstrumented">
            <mat-option [value]="true">
              {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.YES' | translate }}
            </mat-option>
            <mat-option [value]="false">
              {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.NO' | translate }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      }
    </td>

    <!-- Life Column -->
    <td class="py-2 px-1 text-center">
      @if (shot().armament.weaponType.toLowerCase() !== mortarType) {
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="max-w-28">
          <input matInput type="number" step="1" [formField]="formPath().armament.tubeLifePercentage" />
          <span matSuffix class="pr-2 text-sm text-gray-500">%</span>
        </mat-form-field>
      }
    </td>

    <!-- Observations Column -->
    <td class="mat-column-observations py-2 px-1">
      <div class="flex gap-2">
        <button
          mat-icon-button
          type="button"
          aria-label="Observaciones"
          class="!text-gray-600 scale-90"
          [matTooltip]="shot().armament.observations || 'Sin observaciones'"
        >
          <ui-inta-icon name="info" size="xxl" />
        </button>
        @if (!readonly() && hasWeaponType()) {
          <button
            mat-icon-button
            type="button"
            aria-label="Editar"
            class="!text-gray-600 scale-90"
            (click)="openUpdateDialog()"
          >
            <ui-inta-icon name="edit" size="xxl" />
          </button>
        }
      </div>
    </td>
  `,
  styles: [
    `
      .weapon-search-container {
        display: flex;
        align-items: center;
        padding: 0 16px;
        height: 48px;
        min-height: 48px;
        border-bottom: 1px solid #e5e7eb;
        background-color: white;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .weapon-search-container .weapon-search-icon {
        color: #9ca3af;
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .weapon-search-container .weapon-search-input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 14px;
        color: #374151;
        background: transparent;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmamentRow implements OnInit {
  readonly shot = model.required<ArmamentSerieShot>();
  readonly formPath = input.required<ShotFormPath>();
  readonly readonly = input<boolean>(false);
  readonly shotIndex = input.required<number>();

  readonly #armamentStore = inject(ArmamentStore);
  readonly #armamentDialogService = inject(ArmamentDialogService);
  readonly #injector = inject(Injector);
  #loadedTubeFamilyId: number | null = null;

  constructor() {
    effect(() => {
      const armament = this.shot().armament;
      if (!armament.weaponExternalId || armament.weaponType.toLowerCase() === SpecimenType.Mortar) return;

      const familyId = this.#armamentStore
        .weaponDenominations()
        .find((weapon) => String(weapon.id) === String(armament.weaponExternalId))?.familyId;

      if (familyId === undefined || familyId === this.#loadedTubeFamilyId) return;

      this.#loadedTubeFamilyId = familyId;
      this.#armamentStore.loadTubeDenominations(familyId);
    });
  }

  readonly hasWeaponType = signal<boolean>(false);

  readonly mortarType = SpecimenType.Mortar;

  readonly typeOptions = [
    { value: SpecimenType.Weapon, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_WEAPON' },
    { value: SpecimenType.Mortar, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_MORTAR' },
  ] as const;

  readonly weaponOptions = computed(() => {
    const weaponType = this.shot().armament.weaponType.toLowerCase();

    const denominations =
      weaponType === SpecimenType.Mortar
        ? this.#armamentStore.mortarDenominations()
        : this.#armamentStore.weaponDenominations();

    const singleShotArray = [this.shot()];
    return mergeCatalogOptions(
      denominations,
      singleShotArray,
      'weaponExternalId',
      'weaponName',
      weaponType === SpecimenType.Mortar ? 'MORTAR' : 'WEAPON',
    );
  });

  readonly weaponSearchTerm = signal<string>('');

  readonly filteredWeaponOptions = computed(() => {
    const search = this.weaponSearchTerm().trim().toLowerCase();
    const options = this.weaponOptions();
    if (!search) return options;
    return options.filter((weapon) => weapon.name.toLowerCase().includes(search));
  });

  onWeaponSearchInput(value: string): void {
    this.weaponSearchTerm.set(value);
  }

  onWeaponSelectOpenedChange(opened: boolean): void {
    if (!opened) {
      this.weaponSearchTerm.set('');
    }
  }

  readonly tubeOptions = computed(() => {
    const denominations = this.#armamentStore.tubeDenominations();
    const singleShotArray = [this.shot()];
    return mergeCatalogOptions(denominations, singleShotArray, 'tubeExternalId', 'tubeName', 'TUBE');
  });

  ngOnInit(): void {
    const hasWeaponType = !!this.shot().armament.weaponType;
    this.hasWeaponType.set(hasWeaponType);

    if (!hasWeaponType) return;

    const weaponType = this.shot().armament.weaponType.toLowerCase();

    if (weaponType === SpecimenType.Mortar) {
      if (!this.#armamentStore.mortarDenominations().length && !this.#armamentStore.isLoadingMortarDenominations()) {
        this.#armamentStore.loadMortarDenominations();
      }

      return;
    }

    if (!this.#armamentStore.weaponDenominations().length && !this.#armamentStore.isLoadingWeaponDenominations()) {
      this.#armamentStore.loadWeaponDenominations();
    }
  }

  onWeaponTypeChange(itemType: string | null | undefined): void {
    this.#updateShotArmament({
      weaponExternalId: '',
      weaponName: '',
      tubeExternalId: '',
      tubeName: '',
    });

    this.hasWeaponType.set(!!itemType);

    this.#armamentStore.clearTubeDenominations();

    if (itemType?.toLowerCase() === SpecimenType.Mortar && !this.#armamentStore.mortarDenominations().length) {
      this.#armamentStore.loadMortarDenominations();
    }

    if (itemType?.toLowerCase() === SpecimenType.Weapon && !this.#armamentStore.weaponDenominations().length) {
      this.#armamentStore.loadWeaponDenominations();
    }
  }

  onWeaponChange(weaponId: string | null | undefined): void {
    this.#updateShotArmament({
      tubeExternalId: '',
      tubeName: '',
    });

    if (!weaponId) {
      this.#armamentStore.clearTubeDenominations();
      return;
    }
    const weapon = this.weaponOptions().find((w) => w.id === weaponId);
    if (weapon?.familyId !== undefined) {
      this.#armamentStore.loadTubeDenominations(weapon.familyId);
    }
  }

  async openUpdateDialog(): Promise<void> {
    if (this.readonly()) return;

    const result = await this.#armamentDialogService.openUpdateDialog(
      this.shotIndex(),
      this.shot(),
      this.weaponOptions(),
      this.tubeOptions(),
      this.#injector,
    );

    if (result) {
      const selectedTube = this.tubeOptions().find(
        (tube) => (tube.denominationId?.toString() ?? tube.id) === result.tubeExternalId,
      );

      this.#updateShotArmament({
        ...result,
        weaponName: this.weaponOptions().find((weapon) => weapon.id === result.weaponExternalId)?.name ?? '',
        tubeName: selectedTube?.modelName ?? selectedTube?.name ?? '',
      });
    }
  }

  #updateShotArmament(patch: Partial<ArmamentSerieShotDetail>): void {
    this.shot.update((currentShot) => ({
      ...currentShot,
      armament: {
        ...currentShot.armament,
        ...patch,
      },
    }));
  }
}
