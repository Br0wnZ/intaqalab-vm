import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { applyEach, form, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { Badge } from '@intaqalab/ui';
import { TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionsStore } from '../../+state/munitions.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import type { MasterDataI18nItem, MasterDataIItem } from '../../utils-models/catalog.model';
import type {
  BackendMunitionComponent,
  ComponentDetail,
  ComponentType,
  Configuration,
  Denomination,
  FuseWorkingMode,
  MunitionConfigRequest,
  Serie,
  SeriesMunitionsData,
} from '../../utils-models/munitions.model';
import {
  createEmptyConfiguration,
  createEmptySerie,
  getSelectedComponentTypes,
} from '../../utils-models/munitions.model';
import { MassiveMunitionsConfigurationDialog } from './massive-munitions-configuration-dialog/massive-munitions-configuration-dialog';
import { SeriePanelComponent } from './serie-panel/serie-panel.component';

@Component({
  selector: 'inta-munitions',
  imports: [MatExpansionModule, MatButtonModule, SeriePanelComponent, TranslateModule, Badge, TrialStatusLabelPipe],
  providers: [MunitionsStore, SeriesAndShotsStore],
  template: `
    <div class="py-6">
      <div>
        <div class="flex justify-between items-center mb-6">
          <div class="flex gap-2">
            <h2 class="bg-purple-200/50 text-purple-700 p-2 rounded-lg">
              {{ trialCode() }}
            </h2>
            <ui-badge [status]="trialStatus()">
              {{ trialStatus()! | trialStatusLabel }}
            </ui-badge>
          </div>
          <button mat-flat-button [disabled]="checkIfAnyConfigurationsHaveValues()" (click)="openMassiveConfigDialog()">
            {{ 'TRIAL_PLANNING.MUNITIONS.HEADER.MASSIVE_CONFIG_BUTTON' | translate }}
          </button>
        </div>

        <mat-accordion class="flex flex-col gap-5">
          @for (serie of seriesSignal(); track serie.seriesId; let serieIdx = $index) {
            <inta-serie-panel
              [serie]="serie"
              [serieIndex]="serieIdx"
              [seriesSignal]="seriesSignal"
              [shots]="shotsPerSerie().get(serie.seriesId) ?? []"
              [expanded]="serieIdx === 0"
              (deleteConfiguration)="deleteConfiguration(serieIdx, $event)"
            />
          }
        </mat-accordion>

        @if (seriesSignal().length === 0) {
          <div class="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm">
            {{ 'TRIAL_PLANNING.MUNITIONS.HEADER.EMPTY_STATE' | translate }}
          </div>
        }

        <div class="mt-6 flex gap-4 justify-end">
          <button mat-flat-button [disabled]="!isFormValid()" (click)="saveForm()">
            {{ 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' | translate }}
          </button>
          <button mat-stroked-button [disabled]="!isFormValid()" (click)="resetForm()">
            {{ 'TRIAL_PLANNING.MUNITIONS.HEADER.CANCEL_BUTTON' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-form-field-infix {
        min-height: 40px !important;
        padding-top: 10px !important;
        padding-bottom: 10px !important;
      }

      .mat-mdc-text-field-wrapper {
        min-height: 40px !important;
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Munitions {
  /** Si true, el componente está en modo solo lectura (el usuario no puede editar) */
  readonly readonly = input<boolean>(false);

  readonly #munitionsStore = inject(MunitionsStore);
  readonly #planningGeneralDataStore = inject(PlanningGeneralDataStore);
  readonly #dialog = inject(MatDialog);
  readonly #seriesAndShotsStore = inject(SeriesAndShotsStore);
  readonly #injector = inject(Injector);

  readonly shotsPerSerie = computed(() => {
    const series = this.#seriesAndShotsStore.series() ?? [];
    return new Map(series.map((s) => [s.id, s.shots]));
  });

  readonly seriesSignal = signal<Serie[]>([]);

  readonly isLoading = this.#munitionsStore.isLoading;
  readonly isSaving = this.#munitionsStore.isUpdatingMunitions;
  readonly updateStatus = this.#munitionsStore.updateMunitionsStatus;

  readonly trialCode = computed(() => this.#planningGeneralDataStore.fireTrialCode());
  readonly trialStatus = computed(() => this.#planningGeneralDataStore.fireTrial()?.status);

  #initialSeriesData: Serie[] = [];
  #isLocalInitialized = false;
  #preDeleteSnapshot: Serie[] | null = null;
  #massiveDialogOpen = false;

  constructor() {
    effect(() => {
      const trialId = this.#planningGeneralDataStore.fireTrialId();
      if (trialId && !this.#munitionsStore.isInitialized()) {
        this.#munitionsStore.loadMunitions();
        this.#munitionsStore.loadAllCatalogs();
      }
    });

    effect(() => {
      const trialId = this.#planningGeneralDataStore.fireTrialId();
      if (trialId && !this.#seriesAndShotsStore.isInitialized()) {
        this.#seriesAndShotsStore.loadSeries();
      }
    });

    effect(() => {
      const allSeries = this.#seriesAndShotsStore.series();
      const seriesMunitions = this.#munitionsStore.seriesMunitions();
      const componentTypes = this.#munitionsStore.componentTypes();
      const denominations = this.#munitionsStore.denominations();
      const fuseWorkingModes = this.#munitionsStore.fuseWorkingModes();
      const munitionsStatus = this.#munitionsStore.munitionsStatus();

      if (!allSeries) return;

      const mappedMunitions = this.#mapBackendToLocal(
        seriesMunitions ?? [],
        componentTypes,
        denominations,
        fuseWorkingModes,
      );
      const munitionsById = new Map(mappedMunitions.map((s) => [s.seriesId, s]));

      const completeSeries = allSeries.map(
        (serie) =>
          munitionsById.get(serie.id) ?? {
            seriesId: serie.id,
            seriesName: serie.name,
            configurations: [],
          },
      );

      this.seriesSignal.set(completeSeries);

      if (!this.#isLocalInitialized && (munitionsStatus === 'resolved' || munitionsStatus === 'error')) {
        this.#initialSeriesData = this.#deepClone(completeSeries);
        this.#isLocalInitialized = true;
      }
    });

    effect(() => {
      const status = this.updateStatus();
      if (status === 'resolved') {
        this.#preDeleteSnapshot = null;
        if (!this.#massiveDialogOpen) {
          this.#munitionsStore.resetUpdateMunitions();
          this.#munitionsStore.reloadMunitions();
        }
      } else if (status === 'error') {
        if (this.#preDeleteSnapshot !== null) {
          this.seriesSignal.set(this.#preDeleteSnapshot);
          this.#preDeleteSnapshot = null;
        }
        this.#munitionsStore.resetUpdateMunitions();
      }
    });
  }

  seriesForm = form(this.seriesSignal, (formPath) => {
    applyEach(formPath, (seriePath) => {
      required(seriePath.seriesName);
      required(seriePath.seriesId);
      applyEach(seriePath.configurations, (configPath) => {
        validate(configPath.denomination, ({ value, valueOf }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const selected: string[] = valueOf(configPath.selectedComponents as any) ?? [];
          const components: ComponentDetail[] = valueOf(configPath.components) ?? [];
          const shots: string[] = valueOf(configPath.assignedShotIds) ?? [];

          // Component forms are valid when all non-powder selected components have
          // a denomination and a correctly formatted clientNumber.
          // When this condition holds, denomination and munition-type are not required.
          const componentFormsAreValid =
            selected.length > 0 &&
            selected.every((selType) => {
              const normType = selType.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');

              // All powder types (pólvora, polvora-1, polvora-2, …) are exempt
              if (normType === 'polvora' || normType.startsWith('polvora-')) return true;

              const comp = components.find((c) => c.type.type.toLowerCase() === selType.toLowerCase());
              if (!comp?.denomination?.id) return false;

              const clientNumber = String(comp.clientNumber ?? '').trim();
              if (clientNumber) {
                if (clientNumber.endsWith(',')) return false;
                const parts = clientNumber.split(',').filter((x) => x.trim().length > 0);
                if (parts.length > shots.length) return false;
              }

              return true;
            });

          if (componentFormsAreValid) return undefined;

          return !value()
            ? { kind: 'required', message: 'TRIAL_PLANNING.MUNITIONS.VALIDATION.DENOMINATION_REQUIRED' }
            : undefined;
        });

        validate(configPath.assignedShotIds, ({ value }) => {
          const shots = value();
          return !shots || shots.length === 0
            ? { kind: 'required-shots', message: 'TRIAL_PLANNING.MUNITIONS.VALIDATION.ASSIGNED_SHOTS_REQUIRED' }
            : undefined;
        });

        // Validate config-level reconditioning via configPath
        validate(configPath, ({ value }) => {
          const config = value();
          const reconditioning = config.reconditioning;
          if (!reconditioning) return undefined; // conditioning not enabled
          const isValidNum = (v: number | undefined | null): boolean =>
            v !== undefined && v !== null && !isNaN(v as number);
          const valid =
            isValidNum(reconditioning.temperature) &&
            isValidNum(reconditioning.tolerance) &&
            isValidNum(reconditioning.timeMin) &&
            isValidNum(reconditioning.timeMax);
          return valid
            ? undefined
            : {
                kind: 'reconditioning-required',
                message: 'TRIAL_PLANNING.MUNITIONS.VALIDATION.RECONDITIONING_REQUIRED',
              };
        });

        // Validate component-level reconditioning: each component's reconditioning if present
        validate(configPath, ({ value }) => {
          const config = value();
          const components = config.components ?? [];
          const isValidNum = (v: number | undefined | null): boolean =>
            v !== undefined && v !== null && !isNaN(v as number);
          const allValid = components.every((comp) => {
            const r = comp.reconditioning;
            if (!r) return true; // not enabled
            return (
              isValidNum(r.temperature) && isValidNum(r.tolerance) && isValidNum(r.timeMin) && isValidNum(r.timeMax)
            );
          });
          return allValid
            ? undefined
            : {
                kind: 'component-reconditioning-required',
                message: 'TRIAL_PLANNING.MUNITIONS.VALIDATION.RECONDITIONING_REQUIRED',
              };
        });
      });
    });
  });

  getSerieField(serieIdx: number): unknown {
    return (this.seriesForm as unknown as Record<number, unknown>)[serieIdx];
  }

  getConfigField(serieIdx: number, configIdx: number): unknown {
    const serieForm = this.seriesForm as unknown as Record<number, { configurations: unknown[] }>;
    return serieForm[serieIdx]?.configurations[configIdx];
  }

  addSerie(): void {
    this.seriesSignal.update((series) => [...series, createEmptySerie(`Serie ${series.length + 1}`)]);
  }

  removeSerie(serieIndex: number): void {
    this.seriesSignal.update((series) => series.filter((_, idx) => idx !== serieIndex));
  }

  isFormValid(): boolean {
    const series = this.seriesSignal();
    const allSeriesHaveConfigurations = series.length > 0 && series.some((s) => s.configurations.length > 0);
    return allSeriesHaveConfigurations && this.seriesForm().valid();
  }

  getFormValues(): Serie[] {
    return this.seriesSignal();
  }

  openMassiveConfigDialog(): void {
    this.#massiveDialogOpen = true;
    const dialogRef = this.#dialog.open(MassiveMunitionsConfigurationDialog, {
      maxWidth: 1200,
      width: '100vw',
      height: '100vh',
      maxHeight: 800,
      disableClose: false,
      injector: this.#injector,
      data: {
        preloadedData: {
          denomination: '',
          conditioning: false,
          selectedComponents: [],
        },
      },
    });

    dialogRef.afterClosed().subscribe((saved: boolean | null) => {
      this.#massiveDialogOpen = false;
      this.#munitionsStore.resetUpdateMunitions();
      if (saved) {
        this.#munitionsStore.reloadMunitions();
      }
    });
  }

  saveForm(): void {
    if (!this.isFormValid()) {
      console.error('Formulario inválido');
      return;
    }

    const configurations = this.#mapLocalToRequest(this.seriesSignal());
    this.#munitionsStore.updateMunitions({ configurations });
  }

  resetForm(): void {
    this.seriesSignal.set(this.#deepClone(this.#initialSeriesData));
  }

  deleteConfiguration(serieIdx: number, configIdx: number): void {
    this.#preDeleteSnapshot = this.#deepClone(this.seriesSignal());

    this.seriesSignal.update((series) =>
      series.map((s, idx) => {
        if (idx !== serieIdx) return s;
        return { ...s, configurations: s.configurations.filter((_, cIdx) => cIdx !== configIdx) };
      }),
    );

    if (!this.isFormValid()) {
      console.warn('Form inválido tras eliminar configuración, PUT cancelado');
      this.#preDeleteSnapshot = null;
      return;
    }

    const configurations = this.#mapLocalToRequest(this.seriesSignal());
    this.#munitionsStore.updateMunitions({ configurations });
  }

  loadConfiguration(data: Serie[]): void {
    this.seriesSignal.set(data);
    this.#initialSeriesData = this.#deepClone(data);
  }

  validateConfiguration(): boolean {
    return this.isFormValid();
  }

  exportToJSON(): string {
    return JSON.stringify(this.seriesSignal(), null, 2);
  }

  importFromJSON(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);
      this.loadConfiguration(data);
      console.log('Configuración importada correctamente');
    } catch (error) {
      console.error('Error al importar configuración:', error);
    }
  }

  resetConfiguration(): void {
    const defaultData = [
      {
        ...createEmptySerie('Serie 1'),
        configurations: [createEmptyConfiguration()],
      },
    ];
    this.loadConfiguration(defaultData);
  }

  #resolveDenominationId(denomination: string | null | undefined, denominations: MasterDataI18nItem[]): string {
    if (!denomination) return '';
    const found = denominations.find((d) => d.label === denomination || d.id === denomination);
    return found?.id ?? denomination;
  }

  #deepClone(data: Serie[]): Serie[] {
    return structuredClone(data);
  }

  #mapBackendToLocal(
    seriesMunitions: SeriesMunitionsData[],
    componentTypes: MasterDataI18nItem[],
    denominations: MasterDataI18nItem[],
    fuseWorkingModes: MasterDataIItem[],
  ): Serie[] {
    return seriesMunitions.map((series) => ({
      seriesId: series.seriesId,
      seriesName: series.seriesName,
      configurations: series.configurations.map((config): Configuration => {
        let powderCount = 0;
        const components = config.components.map((comp) => {
          const detail = this.#mapComponentToDetail(comp, componentTypes, denominations, fuseWorkingModes);
          const typeNormalized = detail.type.type
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          if (typeNormalized === 'polvora' || typeNormalized.startsWith('polvora-')) {
            powderCount++;
            if (powderCount > 1) {
              detail.type.type = `polvora-${powderCount - 1}`;
              detail.type.label = `Pólvora ${powderCount - 1}`;
            } else {
              detail.type.type = 'pólvora';
              detail.type.label = 'Pólvora';
            }
          }
          return detail;
        });

        const denomination = this.#resolveDenominationId(config.denomination?.id, denominations);

        return {
          id: config.id,
          seriesId: config.seriesId,
          munitionTypeId: config.munitionTypeId ?? '',
          denomination,
          batch: config.batch ?? '',
          reconditioning: config.reconditioning ?? undefined,
          maxAllowedErrors: config.maxAllowedErrors ?? 0,
          observations: config.observations ?? '',
          assignedShotIds: config.assignedShotIds ?? null,
          components,
          selectedComponents: getSelectedComponentTypes({
            id: config.id,
            seriesId: config.seriesId,
            munitionTypeId: config.munitionTypeId ?? '',
            denomination,
            batch: config.batch ?? '',
            maxAllowedErrors: config.maxAllowedErrors ?? 0,
            observations: config.observations ?? '',
            assignedShotIds: config.assignedShotIds ?? null,
            components,
          }),
        };
      }),
    }));
  }

  // checkear si hay configuraciones en munitions
  checkIfAnyConfigurationsHaveValues(): boolean {
    const series = this.seriesSignal();
    return series.some((s) =>
      s.configurations.some((c) => c.denomination || c.batch || (c.components && c.components.length > 0)),
    );
  }

  #mapComponentToDetail(
    component: BackendMunitionComponent,
    componentTypes: MasterDataI18nItem[],
    denominations: MasterDataI18nItem[],
    fuseWorkingModes: MasterDataIItem[],
  ): ComponentDetail {
    return {
      id: component.id,
      type: this.#resolveComponentType(component, componentTypes),
      denomination: this.#resolveDenomination(component, denominations),
      batch: component.batch ?? '',
      reconditioning: component.reconditioning ?? undefined,
      clientNumber:
        component.clientNumber !== undefined && component.clientNumber !== null ? String(component.clientNumber) : '',
      observations: component.observations ?? '',
      fuseWorkingMode: this.#resolveFuseWorkingMode(component, fuseWorkingModes),
      fuseMeasurement: component.fuseMeasurement ?? 0,
      maxAllowedErrors: component.maxAllowedErrors ?? 0,
      manufacturerNumber: '',
    };
  }

  #resolveComponentType(component: BackendMunitionComponent, componentTypes: MasterDataI18nItem[]): ComponentType {
    if (component.type?.id) {
      const typeId = component.type.id;
      const catalogType = componentTypes.find((ct) => ct.id === typeId);
      const label = catalogType?.label ?? component.type.label ?? '';
      return { id: component.type.id, type: label.toLowerCase(), label };
    }

    const typeId = component.typeId?.id?.value ?? '';
    const matchedType = componentTypes.find((item) => item.id === typeId);
    const label = matchedType?.label ?? component.typeId?.label ?? component.typeId?.type ?? '';

    return { id: typeId, label, type: label.toLowerCase() };
  }

  #resolveDenomination(component: BackendMunitionComponent, denominations: MasterDataI18nItem[]): Denomination {
    if (component.denomination?.id) {
      return { id: component.denomination.id, name: component.denomination.name ?? '' };
    }

    const denominationId = component.denominationId?.id?.value ?? '';
    const matchedDenomination = denominations.find((item) => item.id === denominationId);
    const name = matchedDenomination?.label ?? component.denominationId?.name ?? '';

    return { id: denominationId, name: name ?? '' };
  }

  #resolveFuseWorkingMode(
    component: BackendMunitionComponent,
    fuseWorkingModes: MasterDataIItem[],
  ): FuseWorkingMode | undefined {
    if (component.fuseWorkingMode?.id) {
      return component.fuseWorkingMode;
    }

    const fuseWorkingModeId = component.fuseWorkingModeId ?? '';
    if (!fuseWorkingModeId) return undefined;

    const matchedMode = fuseWorkingModes.find((item) => item.id === fuseWorkingModeId);
    const label = matchedMode?.label ?? '';

    return { id: fuseWorkingModeId, type: label, label };
  }

  #mapLocalToRequest(series: Serie[]): MunitionConfigRequest[] {
    return series.flatMap((serie) =>
      serie.configurations.map(
        (config): MunitionConfigRequest => ({
          id: config.id,
          seriesId: serie.seriesId,
          denominationId: config.denomination,
          batch: config.batch,
          observations: config.observations,
          reconditioning: config.reconditioning,
          maxAllowedErrors: config.maxAllowedErrors,
          components: config.components.map((comp) => ({
            typeId: comp.type.id,
            denominationId: comp.denomination.id,
            batch: comp.batch,
            reconditioning: comp.reconditioning,
            clientNumber: comp.clientNumber,
            observations: comp.observations,
            fuseWorkingModeId: comp.fuseWorkingMode?.id,
            fuseMeasurement: comp.fuseMeasurement,
            maxAllowedErrors: comp.maxAllowedErrors,
          })),
          assignedShotIds: config.assignedShotIds ?? undefined,
        }),
      ),
    );
  }
}
