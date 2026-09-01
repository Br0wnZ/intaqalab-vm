import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
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
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
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
        <mat-select clearable [formField]="formPath().armament.weaponExternalId" (valueChange)="onWeaponChange($event)">
          @for (weapon of weaponOptions(); track weapon.id) {
            <mat-option [value]="weapon.id">{{ weapon.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </td>

    <!-- Tube Column -->
    <td class="py-2 px-1">
      @if (shot().armament.weaponType?.toLowerCase() !== 'mortar') {
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-select clearable [formField]="formPath().armament.tubeExternalId">
            @for (tube of tubeOptions(); track tube.id) {
              <mat-option [value]="tube.denominationId">{{ tube.modelName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    </td>

    <!-- Instrumented Column -->
    <td class="py-2 px-1">
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
    </td>

    <!-- Life Column -->
    <td class="py-2 px-1 text-center">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="max-w-28">
        <input matInput type="number" step="1" [formField]="formPath().armament.tubeLifePercentage" />
        <span matSuffix class="pr-2 text-sm text-gray-500">%</span>
      </mat-form-field>
    </td>

    <!-- Observations Column -->
    <td class="mat-column-observations py-2 px-1">
      <div class="flex gap-2">
        <button
          mat-icon-button
          type="button"
          class="!text-gray-600 scale-90"
          [matTooltip]="shot().armament.observations || 'Sin observaciones'"
        >
          <ui-inta-icon name="info" size="xxl" />
        </button>
        @if (!readonly() && hasWeaponType()) {
          <button mat-icon-button type="button" class="!text-gray-600 scale-90" (click)="openUpdateDialog()">
            <ui-inta-icon name="edit" size="xxl" />
          </button>
        }
      </div>
    </td>
  `,
  styles: [``],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmamentRow implements OnInit {
  readonly shot = model.required<ArmamentSerieShot>();
  readonly formPath = input.required<ShotFormPath>();
  readonly readonly = input<boolean>(false);
  readonly shotIndex = input.required<number>();

  readonly #armamentStore = inject(ArmamentStore);
  readonly #planningGeneralDataStore = inject(PlanningGeneralDataStore);
  readonly #armamentDialogService = inject(ArmamentDialogService);

  readonly hasWeaponType = signal<boolean>(false);

  readonly typeOptions = [
    { value: SpecimenType.Weapon, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_WEAPON' },
    { value: SpecimenType.Mortar, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_MORTAR' },
  ] as const;

  readonly weaponOptions = computed(() => {
    const denominations = this.#armamentStore.weaponDenominations();
    const singleShotArray = [this.shot()];
    return mergeCatalogOptions(denominations, singleShotArray, 'weaponExternalId', 'weaponName', 'WEAPON');
  });

  readonly tubeOptions = computed(() => {
    const denominations = this.#armamentStore.tubeDenominations();
    const singleShotArray = [this.shot()];
    return mergeCatalogOptions(denominations, singleShotArray, 'tubeExternalId', 'tubeName', 'TUBE');
  });

  ngOnInit(): void {
    const hasWeaponType = !!this.shot().armament.weaponType;

    this.hasWeaponType.set(hasWeaponType);
  }

  onWeaponTypeChange(itemType: string | null | undefined): void {
    this.#updateShotArmament({
      weaponExternalId: '',
      weaponName: '',
      tubeExternalId: '',
      tubeName: '',
    });

    this.hasWeaponType.set(!!itemType);

    if (itemType) {
      this.#armamentStore.loadWeaponDenominations(itemType.toUpperCase());
      this.#armamentStore.clearTubeDenominations();
    } else {
      this.#armamentStore.clearWeaponDenominations();
      this.#armamentStore.clearTubeDenominations();
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
    if (this.readonly()) {
      return;
    }
    const trialId = this.#planningGeneralDataStore.fireTrialId();

    if (!trialId) {
      console.error('No se pudo obtener el trialId');
      return;
    }

    const wasUpdated = await this.#armamentDialogService.openUpdateDialog(
      trialId,
      this.shotIndex(),
      this.shot(),
      this.weaponOptions(),
      this.tubeOptions(),
    );

    if (wasUpdated) {
      this.#armamentStore.reloadArmament();
      console.info('Shot actualizado correctamente');
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
