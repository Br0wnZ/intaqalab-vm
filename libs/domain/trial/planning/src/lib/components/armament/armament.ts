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
import { applyEach, disabled, form, max, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import type { MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { Badge, ErrorState, Skeleton, SkeletonTable } from '@intaqalab/ui';
import { RangePipe, TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ArmamentStore } from '../../+state/armament.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type { ArmamentSerie, ArmamentSerieShot, MassiveConfigData } from '../../utils-models/armament.model';
import { SpecimenType } from '../../utils-models/specimen.model';
import { ArmamentDialogService } from './armament-dialog.service';
import { ArmamentMapperService } from './armament-mapper.service';
import { ArmamentRow, type ShotFormPath } from './armament-row';
import type { MassiveShotsConfigurationDialog } from './massive-shots-configuration-dialog';

type ArmamentFormType = FieldTree<ArmamentSerie[]>;

@Component({
  selector: 'inta-armament',
  imports: [
    MatExpansionModule,
    MatButtonModule,
    TranslateModule,
    Badge,
    TrialStatusLabelPipe,
    ArmamentRow,
    Skeleton,
    SkeletonTable,
    ErrorState,
    RangePipe,
  ],
  providers: [ArmamentStore],
  template: `
    @if (isLoadingView()) {
      <div class="py-6 space-y-6">
        <!-- Top header skeleton -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex gap-2">
            <ui-skeleton variant="rectangle" width="100px" height="36px" animation="wave" />
            <ui-skeleton variant="rectangle" width="100px" height="36px" animation="wave" />
          </div>
          <ui-skeleton variant="button" width="220px" height="40px" animation="wave" />
        </div>

        <!-- Expansion Panels Skeleton -->
        <div class="flex flex-col gap-6">
          @for (i of 3 | range; track i) {
            <div class="border border-slate-200 rounded-xl overflow-hidden bg-gray-200 shadow-sm">
              <div class="h-12 px-6 flex items-center justify-between bg-gray-200">
                <ui-skeleton variant="text" width="80px" height="1.25rem" animation="wave" />
                <ui-skeleton variant="circle" width="24px" height="24px" animation="wave" />
              </div>

              @if (i === 0) {
                <div class="py-4 bg-white px-6 space-y-4">
                  <ui-skeleton variant="text" width="140px" height="1.25rem" animation="wave" />
                  <ui-skeleton-table [rows]="2" [columns]="7" />
                </div>
              }
            </div>
          }
        </div>

        <!-- Bottom buttons skeleton -->
        <div class="flex justify-end gap-3 mt-6">
          <ui-skeleton variant="button" width="100px" height="40px" animation="wave" />
          <ui-skeleton variant="button" width="150px" height="40px" animation="wave" />
        </div>
      </div>
    } @else if (viewError()) {
      <ui-error-state
        [title]="'TRIAL_PLANNING.ARMAMENT.ERRORS.LOAD_FAILED_TITLE' | translate"
        [message]="'TRIAL_PLANNING.ARMAMENT.ERRORS.LOAD_FAILED_DETAIL' | translate"
      />
    } @else {
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

        @if (armamentSignal().length === 0) {
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
                    <table class="min-w-full text-xs text-left border-collapse">
                      <thead>
                        <tr class="border-b border-gray-200 bg-gray-100">
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.SERIE' | translate }}
                          </th>
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.SHOT' | translate }}
                          </th>
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.TYPE' | translate }}
                          </th>
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.WEAPON' | translate }}
                          </th>
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.TUBE' | translate }}
                          </th>
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.INSTRUMENTED' | translate }}
                          </th>
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.LIFE' | translate }}
                          </th>
                          <th class="text-xs font-medium text-gray-600 px-6 py-3">
                            {{ 'TRIAL_PLANNING.ARMAMENT.TABLE.OBSERVATIONS' | translate }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (shot of serie.shots; track shot.shotId; let j = $index) {
                          <tr
                            inta-armament-row
                            class="border-b border-gray-200 hover:bg-gray-50"
                            [formPath]="getShotPath(i, j)"
                            [readonly]="readonly()"
                            [serieIndex]="i"
                            [shotIndex]="j"
                            [(shot)]="serie.shots[j]"
                          ></tr>
                        }
                      </tbody>
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
    }
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
  readonly #armamentMapperService = inject(ArmamentMapperService);
  readonly #armamentDialogService = inject(ArmamentDialogService);
  readonly #destroyRef = inject(DestroyRef);

  readonly isLoadingView = computed(
    () => this.#armamentStore.isLoadingArmament() || this.#planningGeneralDataStore.isLoadingPlanningInfo(),
  );

  readonly viewError = computed(
    () => !!this.#armamentStore.armamentError() || !!this.#planningGeneralDataStore.planningInfoError(),
  );

  readonly trialCode = computed(() => this.#planningGeneralDataStore.fireTrialCode());
  readonly trialStatus = computed(() => this.#planningGeneralDataStore.fireTrial()?.status);

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
    return this.#armamentMapperService.mergeCatalogOptions(
      denominations,
      existing,
      'weaponExternalId',
      'weaponName',
      'WEAPON',
    );
  });

  /**
   * Denominaciones de tubo reactivas: se cargan al seleccionar un Arma (familyId).
   * Incluye los tubos ya guardados en el armamento para no perder opciones activas.
   */
  readonly tubeOptions = computed(() => {
    const denominations = this.#armamentStore.tubeDenominations();
    const existing = this.armamentSignal().flatMap((serie) => serie.shots);
    return this.#armamentMapperService.mergeCatalogOptions(
      denominations,
      existing,
      'tubeExternalId',
      'tubeName',
      'TUBE',
    );
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
        if (!seriesArmament) {
          return;
        }
        mergedSeries = this.#armamentMapperService.mapBackendToLocal(seriesArmament);
      } else if (series && series.length > 0) {
        mergedSeries = this.#armamentMapperService.buildSeriesFromStore(series, undefined);
      } else {
        return;
      }

      this.armamentSignal.set(mergedSeries);
      this.#initialArmamentData = this.#armamentMapperService.deepClone(mergedSeries);

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
    return root[i].shots[j] as unknown as ShotFormPath;
  }

  async openMassiveConfiguration(): Promise<void> {
    if (this.readonly()) {
      return;
    }

    const result = await this.#armamentDialogService.openMassiveConfiguration(this.armamentSignal(), (ref) => {
      this.#massiveDialogRef = ref;
    });
    this.#massiveDialogRef = null;

    if (result) {
      this.#applyMassiveConfiguration(result);
      const shots = this.#armamentMapperService.mapLocalToRequest(this.armamentSignal());
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

    const wasUpdated = await this.#armamentDialogService.openUpdateDialog(
      trialId,
      shotIdx,
      shot,
      this.weaponOptions(),
      this.tubeOptions(),
    );

    if (wasUpdated) {
      this.#armamentStore.reloadArmament();
      console.info('Shot actualizado correctamente');
    }
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

    const shots = this.#armamentMapperService.mapLocalToRequest(this.armamentSignal());
    this.#armamentStore.updateArmament({ shots });
  }

  resetForm(): void {
    if (this.readonly()) {
      return;
    }
    this.armamentSignal.set(this.#armamentMapperService.deepClone(this.#initialArmamentData));
  }
}
