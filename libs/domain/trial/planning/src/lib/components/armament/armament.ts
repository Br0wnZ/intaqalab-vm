import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormField, applyEach, disabled, form, max, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import type { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Badge, IntaIconComponent, MatSelectClearable } from '@intaqalab/ui';
import { TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ArmamentStore } from '../../+state/armament.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type {
  ArmamentData,
  ArmamentSerie,
  ArmamentSerieShot,
  ArmamentSerieShotDetail,
  MassiveConfigData,
  MassiveShotsConfigurationDialogData,
  SeriesArmamentData,
  UpdateArmamentDialogData,
} from '../../utils-models/armament.model';
import type { SpecimenItem } from '../../utils-models/catalog.model';
import type { Serie as SeriesAndShotsSerie } from '../../utils-models/series-and-shots.model';
import { SpecimenType } from '../../utils-models/specimen.model';
import { MassiveShotsConfigurationDialog } from './massive-shots-configuration-dialog';
import { UpdateArmamentDialog } from './update-armament-dialog';

type ShotFormPath = FieldTree<ArmamentSerieShot>;
type ArmamentFormType = FieldTree<ArmamentSerie[]>;

@Component({
  selector: 'inta-armament',
  imports: [
    MatExpansionModule,
    MatSelectModule,
    MatSelectClearable,
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
          @if (trialStatus(); as status) {
            <ui-badge [status]="status">
              {{ status | trialStatusLabel }}
            </ui-badge>
          }
        </div>
        @if (!readonly()) {
          <button mat-flat-button [disabled]="isLoading()" (click)="openMassiveConfiguration()">
            {{ 'TRIAL_PLANNING.ARMAMENT.HEADER.MASSIVE_CONFIG_BUTTON' | translate }}
          </button>
        }
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

                    <!-- Type Column -->
                    <ng-container matColumnDef="type">
                      <th
                        *matHeaderCellDef
                        mat-header-cell
                        class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                      >
                        {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.TYPE' | translate }}
                      </th>
                      <td *matCellDef="let element; let j = index" mat-cell class="py-2 px-1">
                        <mat-form-field appearance="outline" subscriptSizing="dynamic">
                          <mat-select
                            clearable
                            [formField]="getShotPath(i, j).armament.weaponType"
                            (valueChange)="onWeaponTypeChange($event, i, j)"
                          >
                            @for (option of typeOptions; track option.value) {
                              <mat-option [value]="option.value">{{ option.label | translate }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      </td>
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
                          <mat-select
                            clearable
                            [formField]="getShotPath(i, j).armament.weaponExternalId"
                            (valueChange)="onWeaponChange($event, i, j)"
                          >
                            @for (weapon of weaponOptions(); track weapon.id) {
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
                        @if (element.armament.weaponType?.toLowerCase() !== 'mortar') {
                          <mat-form-field appearance="outline" subscriptSizing="dynamic">
                            <mat-select clearable [formField]="getShotPath(i, j).armament.tubeExternalId">
                              @for (tube of tubeOptions(); track tube.id) {
                                <mat-option [value]="tube.id">{{ tube.name }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        }
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
                          <mat-select clearable [formField]="getShotPath(i, j).armament.isInstrumented">
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
                      <td *matCellDef="let element; let j = index" mat-cell class="py-2 px-1 text-center">
                        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="max-w-28">
                          <input
                            matInput
                            type="number"
                            step="1"
                            [formField]="getShotPath(i, j).armament.tubeLifePercentage"
                          />
                          <span matSuffix class="pr-2 text-sm text-gray-500">%</span>
                        </mat-form-field>
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
                          <!-- @if (!readonly()) {
                            <button mat-icon-button class="!text-gray-600 scale-90" (click)="openUpdateDialog(i, j)">
                              <ui-inta-icon name="edit" size="xxl" />
                            </button>
                          } -->
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

        @if (!readonly()) {
          <div class="flex justify-end gap-3 mt-6">
            <button mat-stroked-button [disabled]="!isFormValid()" (click)="resetForm()">
              {{ 'COMMONS.CANCEL' | translate }}
            </button>
            <button mat-flat-button [disabled]="!isFormValid() || isSaving()" (click)="saveForm()">
              {{ 'TRIAL_PLANNING.ARMAMENT.FOOTER.SAVE_DRAFT' | translate }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [``],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Armament implements OnInit {
  /** Si true, el componente está en modo solo lectura (el usuario no puede editar) */
  readonly readonly = input<boolean>(false);

  readonly #armamentStore = inject(ArmamentStore);
  readonly #planningGeneralDataStore = inject(PlanningGeneralDataStore);
  readonly dialog = inject(MatDialog);
  readonly #destroyRef = inject(DestroyRef);

  readonly trialCode = computed(() => this.#planningGeneralDataStore.fireTrialCode());
  readonly trialStatus = computed(() => this.#planningGeneralDataStore.fireTrial()?.status);

  displayedColumns: string[] = ['serie', 'shot', 'type', 'weapon', 'tube', 'instrumented', 'life', 'observations'];

  readonly typeOptions = [
    { value: SpecimenType.Weapon, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_WEAPON' },
    { value: SpecimenType.Bundle, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_BUNDLE' },
    { value: SpecimenType.Mortar, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_MORTAR' },
  ] as const;

  readonly armamentSignal = signal<ArmamentSerie[]>([]);

  readonly isLoading = this.#armamentStore.isLoading;
  readonly isSaving = this.#armamentStore.isUpdatingArmament;
  readonly updateStatus = this.#armamentStore.updateArmamentStatus;
  readonly isLoadingWeaponDenominations = this.#armamentStore.isLoadingWeaponDenominations;
  readonly isLoadingTubeDenominations = this.#armamentStore.isLoadingTubeDenominations;

  /**
   * Denominaciones de arma reactivas: se cargan al seleccionar un Tipo.
   * Incluye las armas ya guardadas en el armamento para no perder opciones activas.
   */
  readonly weaponOptions = computed(() => {
    const denominations = this.#armamentStore.weaponDenominations();
    const existing = this.armamentSignal().flatMap((serie) => serie.shots);
    return this.#mergeCatalogOptions(denominations, existing, 'weaponExternalId', 'weaponName', 'WEAPON');
  });

  /**
   * Denominaciones de tubo reactivas: se cargan al seleccionar un Arma (familyId).
   * Incluye los tubos ya guardados en el armamento para no perder opciones activas.
   */
  readonly tubeOptions = computed(() => {
    const denominations = this.#armamentStore.tubeDenominations();
    const existing = this.armamentSignal().flatMap((serie) => serie.shots);
    return this.#mergeCatalogOptions(denominations, existing, 'tubeExternalId', 'tubeName', 'TUBE');
  });

  #initialArmamentData: ArmamentSerie[] = [];
  #armamentApplied = false;
  #massiveDialogRef: MatDialogRef<MassiveShotsConfigurationDialog, MassiveConfigData | undefined> | null = null;

  constructor() {
    effect(() => {
      const trialId = this.#planningGeneralDataStore.fireTrialId();
      if (trialId && !this.#armamentStore.isInitialized()) {
        this.#armamentStore.loadArmament();
      }
    });

    effect(() => {
      const series = this.#planningGeneralDataStore.series();
      const seriesArmament = this.#armamentStore.seriesArmament();
      if (!series?.length && !seriesArmament?.length) return;

      const hasArmament = !!seriesArmament?.length;

      // Si ya se aplicó armament y no hay nuevos datos, no sobrescribir
      if (this.#armamentApplied && !hasArmament) return;

      let mergedSeries: ArmamentSerie[];
      if (hasArmament) {
        // El backend es la fuente de verdad cuando hay datos
        if (!seriesArmament) {
          return;
        }
        mergedSeries = this.#mapBackendToLocal(seriesArmament);
      } else if (series && series.length > 0) {
        // Sin datos de armamento, construir estructura vacía desde planning
        mergedSeries = this.#buildSeriesFromStore(series, undefined);
      } else {
        return;
      }

      this.armamentSignal.set(mergedSeries);
      this.#initialArmamentData = this.#deepClone(mergedSeries);

      if (hasArmament) {
        this.#armamentApplied = true;
      }
    });

    effect(() => {
      const status = this.updateStatus();
      if (status === 'resolved') {
        console.info('Armamento guardado correctamente');
        this.#massiveDialogRef?.close();
        this.#massiveDialogRef = null;
        this.#armamentStore.resetUpdateArmament();
        this.#armamentStore.reloadArmament();
      } else if (status === 'error') {
        console.error('Error al guardar el armamento');
        this.#massiveDialogRef = null;
        this.#armamentStore.resetUpdateArmament();
      }
    });

    this.#destroyRef.onDestroy(() => {
      this.#massiveDialogRef?.close();
      this.#massiveDialogRef = null;
    });
  }

  ngOnInit(): void {
    this.#planningGeneralDataStore.loadSeries();
  }

  readonly armamentForm = form(this.armamentSignal, (root) => {
    applyEach(root, (serie) => {
      applyEach(serie.shots, (shotPath) => {
        required(shotPath.armament.weaponType);
        required(shotPath.armament.weaponExternalId);
        required(shotPath.armament.tubeExternalId, {
          when: ({ valueOf }) => valueOf(shotPath.armament.weaponType)?.toLowerCase() !== SpecimenType.Mortar,
        });

        disabled(shotPath.armament.weaponType, () => this.readonly());
        disabled(
          shotPath.armament.weaponExternalId,
          ({ valueOf }) =>
            this.readonly() || !valueOf(shotPath.armament.weaponType) || this.isLoadingWeaponDenominations(),
        );
        disabled(
          shotPath.armament.tubeExternalId,
          ({ valueOf }) =>
            this.readonly() || !valueOf(shotPath.armament.weaponExternalId) || this.isLoadingTubeDenominations(),
        );
        disabled(shotPath.armament.isInstrumented, () => this.readonly());
        disabled(shotPath.armament.tubeLifePercentage, () => this.readonly());
        min(shotPath.armament.tubeLifePercentage, 0);
        max(shotPath.armament.tubeLifePercentage, 100);
      });
    });
  });

  protected getShotPath(i: number, j: number): ShotFormPath {
    const root = this.armamentForm as unknown as ArmamentFormType;
    // Los índices siempre existen en runtime (provienen del @for sobre armamentSignal).
    // MaybeFieldTree introduce undefined en el tipado de arrays — aserción segura aquí.
    return root[i].shots[j] as unknown as ShotFormPath;
  }

  async openMassiveConfiguration(): Promise<void> {
    if (this.readonly()) {
      return;
    }
    const dialogRef = this.dialog.open<
      MassiveShotsConfigurationDialog,
      MassiveShotsConfigurationDialogData,
      MassiveConfigData | undefined
    >(MassiveShotsConfigurationDialog, {
      width: '800px',
      data: {
        series: this.armamentSignal().map((s) => ({ id: s.seriesId, name: s.seriesName })),
      },
    });

    this.#massiveDialogRef = dialogRef;

    const result = await firstValueFrom(dialogRef.afterClosed());
    this.#massiveDialogRef = null;

    if (result) {
      this.#applyMassiveConfiguration(result);
      const shots = this.#mapLocalToRequest(this.armamentSignal());
      this.#armamentStore.updateArmament({ shots });
    }
  }

  #applyMassiveConfiguration(config: MassiveConfigData): void {
    const currentSeries = this.armamentSignal();
    const targetSeriesIds = config.series.length > 0 ? config.series : currentSeries.map((s) => s.seriesId);

    const updatedSeries = currentSeries.map((serie) => {
      if (!targetSeriesIds.includes(serie.seriesId)) {
        return serie;
      }

      const updatedShots = serie.shots.map((shot) => {
        const updatedArmament = { ...shot.armament };

        if (config.tipo) {
          updatedArmament.weaponType = config.tipo;
        }

        if (config.denominacionArma) {
          updatedArmament.weaponExternalId = config.denominacionArma;
          const foundWeapon =
            this.#armamentStore.weaponDenominations().find((w) => String(w.id) === config.denominacionArma) ??
            this.weaponOptions().find((w) => w.id === config.denominacionArma);
          if (foundWeapon) {
            updatedArmament.weaponName = foundWeapon.name;
          }
        }

        if (config.denominacionTubo) {
          updatedArmament.tubeExternalId = config.denominacionTubo;
          const foundTube =
            this.#armamentStore.tubeDenominations().find((t) => String(t.id) === config.denominacionTubo) ??
            this.tubeOptions().find((t) => t.id === config.denominacionTubo);
          if (foundTube) {
            updatedArmament.tubeName = foundTube.name;
          }
        }

        if (config.instrumentado) {
          updatedArmament.isInstrumented = config.instrumentado === 'si';
        }

        if (config.vidaUtil) {
          updatedArmament.tubeLifePercentage = Number(config.vidaUtil);
        }

        if (config.observaciones !== undefined && config.observaciones !== '') {
          updatedArmament.observations = config.observaciones;
        }

        return {
          ...shot,
          armament: updatedArmament,
        };
      });

      return {
        ...serie,
        shots: updatedShots,
      };
    });

    this.armamentSignal.set(updatedSeries);
  }

  async openUpdateDialog(serieIdx: number, shotIdx: number): Promise<void> {
    if (this.readonly()) {
      return;
    }
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
        weapons: this.weaponOptions(),
        tubes: this.tubeOptions(),
      },
    });

    const wasUpdated = await firstValueFrom(dialogRef.afterClosed());
    if (wasUpdated) {
      this.#armamentStore.reloadArmament();
      console.info('Shot actualizado correctamente');
    }
  }

  /**
   * Manejador llamado desde el template cuando cambia el Tipo de un disparo.
   * Dispara la carga de denominaciones de arma filtradas por itemType y resetea arma y tubo de la fila.
   */
  onWeaponTypeChange(itemType: string | null | undefined, serieIdx?: number, shotIdx?: number): void {
    this.#updateShotArmament(serieIdx, shotIdx, {
      weaponExternalId: '',
      weaponName: '',
      tubeExternalId: '',
      tubeName: '',
    });

    if (itemType) {
      this.#armamentStore.loadWeaponDenominations(itemType.toUpperCase());
      this.#armamentStore.clearTubeDenominations();
    } else {
      this.#armamentStore.clearWeaponDenominations();
      this.#armamentStore.clearTubeDenominations();
    }
  }

  /**
   * Manejador llamado desde el template cuando cambia la Denominación Arma de un disparo.
   * Extrae el familyId del arma seleccionada, dispara la carga de tubos y resetea el tubo de la fila.
   */
  onWeaponChange(weaponId: string | null | undefined, serieIdx?: number, shotIdx?: number): void {
    this.#updateShotArmament(serieIdx, shotIdx, {
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

  #updateShotArmament(
    serieIdx: number | undefined,
    shotIdx: number | undefined,
    patch: Partial<ArmamentSerieShotDetail>,
  ): void {
    if (serieIdx === undefined || shotIdx === undefined) return;

    this.armamentSignal.update((series) =>
      series.map((serie, sIdx) => {
        if (sIdx !== serieIdx) return serie;
        return {
          ...serie,
          shots: serie.shots.map((shot, shIdx) => {
            if (shIdx !== shotIdx) return shot;
            return {
              ...shot,
              armament: {
                ...shot.armament,
                ...patch,
              },
            };
          }),
        };
      }),
    );
  }

  isFormValid(): boolean {
    return this.armamentForm().valid();
  }

  saveForm(): void {
    if (this.readonly()) {
      return;
    }
    if (!this.isFormValid()) {
      console.error('Formulario inválido');
      return;
    }

    const shots = this.#mapLocalToRequest(this.armamentSignal());
    this.#armamentStore.updateArmament({ shots });
  }

  resetForm(): void {
    if (this.readonly()) {
      return;
    }
    this.armamentSignal.set(this.#deepClone(this.#initialArmamentData));
  }

  #buildSeriesFromStore(series: SeriesAndShotsSerie[], seriesArmament?: SeriesArmamentData[]): ArmamentSerie[] {
    const armamentByShotId = new Map<string, ArmamentData>();

    seriesArmament?.forEach((sArm) => {
      sArm.shots?.forEach((shot) => {
        if (shot.armament) {
          armamentByShotId.set(shot.shotId, shot.armament);
        }
      });
    });

    return series.map((serie, idx) => ({
      seriesId: serie.id,
      seriesName: serie.name || `Serie ${idx + 1}`,
      shots: (serie.shots || []).map((shot) => {
        const existing = armamentByShotId.get(shot.id);
        return {
          shotId: shot.id,
          armament: {
            weaponType: existing?.weaponType ?? '',
            weaponName: existing?.weaponName ?? '',
            weaponExternalId: existing?.weaponExternalId?.toString() ?? '',
            tubeName: existing?.tubeName ?? '',
            tubeExternalId: existing?.tubeExternalId?.toString() ?? '',
            isInstrumented: existing?.isInstrumented ?? false,
            tubeLifePercentage: existing?.tubeLifePercentage ?? 0,
            observations: existing?.observations ?? '',
          },
        };
      }),
    }));
  }

  #deepClone(data: ArmamentSerie[]): ArmamentSerie[] {
    return JSON.parse(JSON.stringify(data));
  }

  #mergeCatalogOptions(
    catalog: SpecimenItem[],
    shots: ArmamentSerie['shots'],
    idKey: 'weaponExternalId' | 'tubeExternalId',
    nameKey: 'weaponName' | 'tubeName',
    fallbackType: 'WEAPON' | 'TUBE',
  ) {
    const byId = new Map<string, SpecimenItem>();

    for (const item of catalog) {
      byId.set(item.id, item);
    }

    for (const shot of shots) {
      const id = shot.armament[idKey];
      if (!id || byId.has(id)) {
        continue;
      }

      byId.set(id, {
        id,
        name: shot.armament[nameKey] || id,
        type: fallbackType,
        active: true,
      });
    }

    return Array.from(byId.values());
  }

  #mapBackendToLocal(seriesArmament: SeriesArmamentData[]): ArmamentSerie[] {
    return seriesArmament.map((series) => ({
      seriesId: series.seriesId,
      seriesName: series.seriesName,
      shots: series.shots.map((shot) => ({
        shotId: shot.shotId,
        armament: {
          weaponType: (shot.armament?.weaponType?.toLowerCase() as SpecimenType) ?? '',
          weaponName: shot.armament?.weaponName ?? '',
          weaponExternalId: shot.armament?.weaponExternalId?.toString() ?? '',
          tubeName: shot.armament?.tubeName ?? '',
          tubeExternalId: shot.armament?.tubeExternalId?.toString() ?? '',
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
        weaponType: shot.armament.weaponType ? (shot.armament.weaponType.toUpperCase() as SpecimenType) : undefined,
        // Conversión string→integer según contrato Swagger
        weaponExternalId: shot.armament.weaponExternalId ? Number(shot.armament.weaponExternalId) : undefined,
        tubeExternalId: shot.armament.tubeExternalId ? Number(shot.armament.tubeExternalId) : undefined,
        isInstrumented: shot.armament.isInstrumented,
        lifeUsefulPercentage:
          shot.armament.tubeLifePercentage !== undefined &&
          shot.armament.tubeLifePercentage !== null &&
          (shot.armament.tubeLifePercentage as unknown) !== ''
            ? Number(shot.armament.tubeLifePercentage)
            : undefined,
        observations: shot.armament.observations || undefined,
      })),
    );
  }
}
