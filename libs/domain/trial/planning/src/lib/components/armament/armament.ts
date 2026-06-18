import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormField, applyEach, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Badge, IntaIconComponent } from '@intaqalab/ui';
import { TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ArmamentStore } from '../../+state/armament.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type { ArmamentSerie, SeriesArmamentData, UpdateArmamentDialogData } from '../../utils-models/armament.model';
import { MassiveShotsConfigurationDialog } from './massive-shots-configuration-dialog';
import { UpdateArmamentDialog } from './update-armament-dialog';

@Component({
  selector: 'inta-armament',
  imports: [
    MatExpansionModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatTableModule,
    MatInputModule,
    MatTooltipModule,
    FormField,
    TranslateModule,
    Badge,
    TrialStatusLabelPipe,
    IntaIconComponent,
  ],
  providers: [ArmamentStore],
  template: `
    <div class="py-6">
      <div class="flex justify-between items-center mb-6">
        <div class="flex gap-2">
          <h2 class="bg-purple-200/50 text-purple-700 p-2 rounded-lg">
            {{ trialCode() }}
          </h2>
          <ui-badge [status]="trialStatus()">
            {{ trialStatus()! | trialStatusLabel }}
          </ui-badge>
        </div>
        <button mat-flat-button [disabled]="isLoading()" (click)="openMassiveConfiguration()">
          {{ 'TRIAL_PLANNING.ARMAMENT.HEADER.MASSIVE_CONFIG_BUTTON' | translate }}
        </button>
      </div>

      @if (isLoading()) {
        <div class="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm">
          {{ 'COMMONS.LOADING' | translate }}
        </div>
      } @else if (armamentSignal().length === 0) {
        <div class="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm">
          {{ 'TRIAL_PLANNING.ARMAMENT.HEADER.EMPTY_STATE' | translate }}
        </div>
      } @else {
        <mat-accordion multi class="flex flex-col gap-6">
          @for (serie of armamentSignal(); track serie.seriesId; let i = $index) {
            <mat-expansion-panel
              class="!shadow-sm !border !border-slate-200 !rounded-xl overflow-hidden !m-0 !bg-gray-200"
              [expanded]="true"
            >
              <mat-expansion-panel-header class="!h-12 !bg-gray-200">
                <mat-panel-title>
                  <h2 class="!font-medium !text-sm !text-gray-900">{{ serie.seriesName }}</h2>
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="py-4 bg-white -mx-6 -mb-6 rounded-t-lg">
                <div class="flex items-center justify-between mb-4 px-6">
                  <h3 class="font-semibold text-sm text-gray-700">
                    {{ 'TRIAL_PLANNING.ARMAMENT.TABLE_TITLE' | translate }}
                  </h3>
                </div>

                <div class="overflow-x-auto">
                  <table mat-table class="min-w-full text-xs" [dataSource]="serie.shots">
                    <!-- Serie Column -->
                    <ng-container matColumnDef="serie">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.SERIE' | translate }}
                      </th>
                      <td *matCellDef="let element" mat-cell class="py-2 px-1">{{ i + 1 }}</td>
                    </ng-container>

                    <!-- Shot Column -->
                    <ng-container matColumnDef="shot">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.SHOT' | translate }}
                      </th>
                      <td *matCellDef="let element; let j = index" mat-cell class="py-2 px-1">{{ j + 1 }}</td>
                    </ng-container>

                    <!-- Weapon Column -->
                    <ng-container matColumnDef="weapon">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.WEAPON' | translate }}
                      </th>
                      <td *matCellDef="let element; let j = index" mat-cell class="py-2 px-1">
                        <mat-form-field appearance="outline" subscriptSizing="dynamic">
                          <mat-select [formField]="$any(getShotField(i, j)).armament.weaponExternalId">
                            @for (weapon of weapons(); track weapon.id) {
                              <mat-option [value]="weapon.id">{{ weapon.name }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      </td>
                    </ng-container>

                    <!-- Tube Column -->
                    <ng-container matColumnDef="tube">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.TUBE' | translate }}
                      </th>
                      <td *matCellDef="let element; let j = index" mat-cell class="py-2 px-1">
                        <mat-form-field appearance="outline" subscriptSizing="dynamic">
                          <mat-select [formField]="$any(getShotField(i, j)).armament.tubeExternalId">
                            @for (tube of tubes(); track tube.id) {
                              <mat-option [value]="tube.id">{{ tube.name }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      </td>
                    </ng-container>

                    <!-- Instrumented Column -->
                    <ng-container matColumnDef="instrumented">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.INSTRUMENTED' | translate }}
                      </th>
                      <td *matCellDef="let element; let j = index" mat-cell class="py-2 px-1">
                        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="max-w-20">
                          <mat-select [formField]="$any(getShotField(i, j)).armament.isInstrumented">
                            <mat-option [value]="true">
                              {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.YES' | translate }}
                            </mat-option>
                            <mat-option [value]="false">
                              {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.NO' | translate }}
                            </mat-option>
                          </mat-select>
                        </mat-form-field>
                      </td>
                    </ng-container>

                    <!-- Life Column -->
                    <ng-container matColumnDef="life">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.LIFE' | translate }}
                      </th>
                      <td *matCellDef="let element" mat-cell class="py-2 px-1 text-center">
                        {{ element.armament.tubeLifePercentage }}%
                      </td>
                    </ng-container>

                    <!-- Observations Column -->
                    <ng-container matColumnDef="observations">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.OBSERVATIONS' | translate }}
                      </th>
                      <td *matCellDef="let element; let j = index" mat-cell class="py-2 px-1">
                        <div class="flex gap-2">
                          <button
                            mat-icon-button
                            class="!text-gray-600 scale-90"
                            [matTooltip]="element.armament.observations || 'Sin observaciones'"
                          >
                            <ui-inta-icon name="info" size="xxl" />
                          </button>
                          <button mat-icon-button class="!text-gray-600 scale-90" (click)="openUpdateDialog(i, j)">
                            <ui-inta-icon name="edit" size="xxl" />
                          </button>
                        </div>
                      </td>
                    </ng-container>

                    <tr *matHeaderRowDef="displayedColumns" mat-header-row class="border-b"></tr>
                    <tr *matRowDef="let row; columns: displayedColumns" mat-row class="border-b hover:bg-gray-50"></tr>
                  </table>
                </div>
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

        <div class="flex justify-end gap-3 mt-6">
          <button mat-stroked-button [disabled]="!isFormValid()" (click)="resetForm()">
            {{ 'COMMONS.CANCEL' | translate }}
          </button>
          <button mat-flat-button [disabled]="!isFormValid() || isSaving()" (click)="saveForm()">
            {{ 'TRIAL_PLANNING.ARMAMENT.FOOTER.SAVE_DRAFT' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [``],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Armament {
  /** Si true, el componente está en modo solo lectura (el usuario no puede editar) */
  readonly readonly = input<boolean>(false);

  readonly #armamentStore = inject(ArmamentStore);
  readonly #planningGeneralDataStore = inject(PlanningGeneralDataStore);
  readonly dialog = inject(MatDialog);

  readonly trialCode = computed(() => this.#planningGeneralDataStore.fireTrialCode());
  readonly trialStatus = computed(() => this.#planningGeneralDataStore.fireTrial()?.status);

  displayedColumns: string[] = ['serie', 'shot', 'weapon', 'tube', 'instrumented', 'life', 'observations'];

  readonly armamentSignal = signal<ArmamentSerie[]>([]);

  readonly isLoading = this.#armamentStore.isLoading;
  readonly isSaving = this.#armamentStore.isUpdatingArmament;
  readonly updateStatus = this.#armamentStore.updateArmamentStatus;
  readonly weapons = this.#armamentStore.weapons;
  readonly tubes = this.#armamentStore.tubes;

  #initialArmamentData: ArmamentSerie[] = [];
  #isLocalInitialized = false;

  constructor() {
    effect(() => {
      const trialId = this.#planningGeneralDataStore.fireTrialId();
      if (trialId && !this.#armamentStore.isInitialized()) {
        this.#armamentStore.loadArmament();
        this.#armamentStore.loadAllCatalogs();
      }
    });

    effect(() => {
      const seriesArmament = this.#armamentStore.seriesArmament();
      if (seriesArmament && seriesArmament.length > 0) {
        const mappedSeries = this.#mapBackendToLocal(seriesArmament);
        this.armamentSignal.set(mappedSeries);
        if (!this.#isLocalInitialized) {
          this.#initialArmamentData = this.#deepClone(mappedSeries);
          this.#isLocalInitialized = true;
        }
      }
    });

    effect(() => {
      const status = this.updateStatus();
      if (status === 'resolved') {
        console.log('Armamento guardado correctamente');
        this.#armamentStore.resetUpdateArmament();
        this.#armamentStore.reloadArmament();
      } else if (status === 'error') {
        console.error('Error al guardar el armamento');
        this.#armamentStore.resetUpdateArmament();
      }
    });
  }

  readonly armamentForm = form(this.armamentSignal, (root) => {
    applyEach(root, (serie) => {
      applyEach(serie.shots, () => {
        // form validations
      });
    });
  });

  getShotField(serieIdx: number, shotIdx: number): unknown {
    const root = this.armamentForm as unknown as Record<number, { shots: unknown[] }>;
    return root[serieIdx]?.shots[shotIdx];
  }

  openMassiveConfiguration() {
    this.dialog.open(MassiveShotsConfigurationDialog, {
      width: '800px',
    });
  }

  openUpdateDialog(serieIdx: number, shotIdx: number): void {
    const serie = this.armamentSignal()[serieIdx];
    const shot = serie.shots[shotIdx];
    const trialId = this.#planningGeneralDataStore.fireTrialId();

    if (!trialId) {
      console.error('No se pudo obtener el trialId');
      return;
    }

    const dialogRef = this.dialog.open<UpdateArmamentDialog, UpdateArmamentDialogData, boolean>(UpdateArmamentDialog, {
      width: '600px',
      data: {
        trialId,
        shotNumber: shotIdx + 1,
        shotId: shot.shotId,
        armament: shot.armament,
        weapons: this.weapons(),
        tubes: this.tubes(),
      },
    });

    dialogRef.afterClosed().subscribe((wasUpdated) => {
      if (wasUpdated) {
        this.#armamentStore.reloadArmament();
        console.log('Shot actualizado correctamente');
      }
    });
  }

  isFormValid(): boolean {
    return this.armamentForm().valid();
  }

  saveForm(): void {
    if (!this.isFormValid()) {
      console.error('Formulario inválido');
      return;
    }

    const shots = this.#mapLocalToRequest(this.armamentSignal());
    this.#armamentStore.updateArmament({ shots });
  }

  resetForm(): void {
    this.armamentSignal.set(this.#deepClone(this.#initialArmamentData));
  }

  #deepClone(data: ArmamentSerie[]): ArmamentSerie[] {
    return JSON.parse(JSON.stringify(data));
  }

  #mapBackendToLocal(seriesArmament: SeriesArmamentData[]): ArmamentSerie[] {
    return seriesArmament.map((series) => ({
      seriesId: series.seriesId,
      seriesName: series.seriesName,
      shots: series.shots.map((shot) => ({
        shotId: shot.shotId,
        armament: {
          weaponName: shot.armament?.weaponName ?? '',
          weaponExternalId: shot.armament?.weaponExternalId ?? '',
          tubeName: shot.armament?.tubeName ?? '',
          tubeExternalId: shot.armament?.tubeExternalId ?? '',
          isInstrumented: shot.armament?.isInstrumented ?? false,
          tubeLifePercentage: shot.armament?.tubeLifePercentage ?? 0,
          observations: shot.armament?.observations ?? '',
        },
      })),
    }));
  }

  #mapLocalToRequest(series: ArmamentSerie[]) {
    return series.flatMap((serie) =>
      serie.shots.map((shot) => ({
        shotId: shot.shotId,
        weaponExternalId: shot.armament.weaponExternalId || undefined,
        tubeExternalId: shot.armament.tubeExternalId || undefined,
        isInstrumented: shot.armament.isInstrumented,
        lifeUsefulPercentage: shot.armament.tubeLifePercentage,
        observations: shot.armament.observations || undefined,
      })),
    );
  }
}
