/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, effect, inject } from '@angular/core';
import type { MasterData, TrialCreateModifyForm } from '@intaqalab/models';
import type { TargetDimension, TargetThickness } from '@intaqalab/models';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { UpdateConditionsRequest } from '../models/shooting-conditions.model';
import { DataPlanningService } from '../services/data-planning-service';
import { SeriesAndShotsService } from '../services/series-and-shots-service';
import { ShootingConditionsService } from '../services/shooting-conditions.service';
import type {
  AddNewSerieRequest,
  AddShotToSerieRequest,
  ReorderSeriesRequest,
  Serie,
  Shot,
} from '../utils-models/series-and-shots.model';
import type { UpsertTrialPlanningInfo } from '../utils-models/trial-planing-info.model';
import type { UpdateShotRequest } from '../utils-models/update-shot-request.model';
import type { UpsertTrialSerieRequest } from '../utils-models/upsert-trial-serie-info.model';

interface PlanningState {
  fireTrialId: string | null;
  fireTrial: TrialCreateModifyForm | null;
  selectedSpecimens: UpsertTrialPlanningInfo['specimens'];
}

const initialState: PlanningState = {
  fireTrialId: null,
  fireTrial: null,
  selectedSpecimens: [],
};
export const PlanningGeneralDataStore = signalStore(
  withState(initialState),

  withComputed(
    (
      store,
      dataPlanningService = inject(DataPlanningService),
      seriesService = inject(SeriesAndShotsService),
      shootingConditionsService = inject(ShootingConditionsService),
    ) => {
      const readPlanningInfo = () =>
        dataPlanningService.getPlanningDataResource.hasValue()
          ? dataPlanningService.getPlanningDataResource.value()
          : undefined;

      return {
        fireTrialCode: computed(() => store.fireTrial()?.code ?? null),

        planningInfo: computed(() => readPlanningInfo()),

        /**
         * The trial is considered to have "general info" once the planning info
         * resource has been resolved and contains any meaningful content.
         */
        hasPlanningInfo: computed(() => {
          const info = readPlanningInfo();
          if (!info) return false;
          return Boolean(info.goal || info.planningUser?.id || (info.specimens && info.specimens.length > 0));
        }),

        shootingConditions: computed(() => shootingConditionsService.conditionsResource.value()),

        isLoadingPlanningInfo: computed(() => dataPlanningService.getPlanningDataResource.isLoading()),

        planningInfoError: computed(() => dataPlanningService.getPlanningDataResource.error()),

        hasPlanningInfoError: computed(() => dataPlanningService.getPlanningDataResource.error() !== undefined),

        specimens: computed(() => {
          const response = dataPlanningService.specimenResource.value();
          if (!response) return [];
          return response.items;
        }),

        isLoadingSpecimens: computed(() => dataPlanningService.specimenResource.isLoading()),

        specimensError: computed(() => dataPlanningService.specimenResource.error()),

        // users: computed(() => dataPlanningService.usersResource.value()),

        // isLoadingUsers: computed(() => dataPlanningService.usersResource.isLoading()),

        // usersError: computed(() => dataPlanningService.usersResource.error()),

        isUpdatingPlanningInfo: computed(() => dataPlanningService.updatePlanningDataResource.isLoading()),

        updatePlanningInfoError: computed(() => dataPlanningService.updatePlanningDataResource.error()),

        updatePlanningInfoStatus: computed(() => dataPlanningService.updatePlanningDataResource.status()),

        series: computed<Serie[] | undefined>(() => {
          const response = seriesService.seriesAndShotsResource.value();
          if (!response) return undefined;

          return response.map((serie: any, idx: number) => ({
            id: serie.id,
            name: serie.name,
            shotQuantity: serie.shots?.length ?? 0,
            executionOrder: serie.executionOrder ?? serie.order ?? idx + 1,
            observations: serie.observations,
            shots: (serie.shots || []).map((shot: Shot & { observations?: string }, sidx: number) => ({
              id: shot.id,
              globalNumber: shot.globalNumber ?? sidx + 1,
              observations: (shot as any).observations || '',
            })),
          }));
        }),

        hasSeries: computed(() => {
          const response = seriesService.seriesAndShotsResource.value();
          return Array.isArray(response) && response.length > 0;
        }),

        hasSeriesWithShots: computed(() => {
          const response = seriesService.seriesAndShotsResource.value();
          return Array.isArray(response) && response.some((serie) => (serie.shots?.length ?? 0) > 0);
        }),

        targetTypes: computed<MasterData[] | undefined>(() => shootingConditionsService.getTargetTypesResource.value()),

        targetMaterials: computed<MasterData[] | undefined>(() =>
          shootingConditionsService.getTargetMaterialsResource.value(),
        ),

        targetDimensions: computed<TargetDimension[] | undefined>(() =>
          shootingConditionsService.getTargetDimensionsResource.value(),
        ),

        targetThicknesses: computed<TargetThickness[] | undefined>(() =>
          shootingConditionsService.getTargetThicknessesResource.value(),
        ),

        impactZones: computed<MasterData[] | undefined>(() => shootingConditionsService.getImpactZonesResource.value()),

        isLoadingSeries: computed(() => seriesService.seriesAndShotsResource.isLoading()),
        seriesError: computed(() => seriesService.seriesAndShotsResource.error()),

        addSerieStatus: computed(() => seriesService.addNewSerieResource.status()),

        isAddingSerie: computed(() => seriesService.addNewSerieResource.isLoading()),

        updateSerieStatus: computed(() => seriesService.updateSerieResource.status()),

        isUpdatingSerie: computed(() => seriesService.updateSerieResource.isLoading()),

        deleteSerieStatus: computed(() => seriesService.deleteSerieResource.status()),

        isDeletingSerie: computed(() => seriesService.deleteSerieResource.isLoading()),

        addShotStatus: computed(() => seriesService.addShotToSerieResource.status()),

        isAddingShot: computed(() => seriesService.addShotToSerieResource.isLoading()),

        deleteShotStatus: computed(() => seriesService.deleteShotFromSerieResource.status()),

        isDeletingShot: computed(() => seriesService.deleteShotFromSerieResource.isLoading()),

        isLoadingShootingConditions: computed(() => shootingConditionsService.conditionsResource.isLoading()),

        isUpdatingConditions: computed(() => shootingConditionsService.updateConditionsResource.isLoading()),

        isLoadingTargetTypes: computed(() => shootingConditionsService.getTargetTypesResource.isLoading()),

        isLoadingTargetMaterials: computed(() => shootingConditionsService.getTargetMaterialsResource.isLoading()),

        isLoadingTargetDimensions: computed(() => shootingConditionsService.getTargetDimensionsResource.isLoading()),

        isLoadingTargetThicknesses: computed(() => shootingConditionsService.getTargetThicknessesResource.isLoading()),

        isLoadingImpactZones: computed(() => shootingConditionsService.getImpactZonesResource.isLoading()),

        updateShotStatus: computed(() => 'idle'),
        isUpdatingShot: computed(() => false),

        isLoading: computed(
          () =>
            dataPlanningService.getPlanningDataResource.isLoading() ||
            dataPlanningService.specimenResource.isLoading() ||
            // dataPlanningService.usersResource.isLoading() ||
            dataPlanningService.updatePlanningDataResource.isLoading() ||
            seriesService.seriesAndShotsResource.isLoading() ||
            shootingConditionsService.conditionsResource.isLoading() ||
            shootingConditionsService.updateConditionsResource.isLoading() ||
            shootingConditionsService.getTargetTypesResource.isLoading() ||
            shootingConditionsService.getTargetMaterialsResource.isLoading() ||
            shootingConditionsService.getTargetDimensionsResource.isLoading() ||
            shootingConditionsService.getTargetThicknessesResource.isLoading() ||
            shootingConditionsService.getImpactZonesResource.isLoading(),
        ),
      };
    },
  ),

  withMethods(
    (
      store,
      dataPlanningService = inject(DataPlanningService),
      seriesService = inject(SeriesAndShotsService),
      shootingConditionsService = inject(ShootingConditionsService),
    ) => ({
      setFireTrialData(fireTrialId: string, fireTrial: TrialCreateModifyForm): void {
        patchState(store, { fireTrialId, fireTrial, selectedSpecimens: [] });
        dataPlanningService.getFireTrialPlanningInfo(fireTrialId);
      },

      setFireTrialId(fireTrialId: string | null): void {
        patchState(store, { fireTrialId, selectedSpecimens: [] });
      },

      setSelectedSpecimens(specimens: UpsertTrialPlanningInfo['specimens']): void {
        patchState(store, { selectedSpecimens: structuredClone(specimens) });
      },

      loadSpecimens(): void {
        dataPlanningService.getSpecimens();
      },

      loadUsers(): void {
        // dataPlanningService.getUsers();
      },

      updatePlanningInfo(data: UpsertTrialPlanningInfo): void {
        const fireTrialId = store.fireTrialId();
        if (!fireTrialId) return;

        dataPlanningService.updateTrialPlanningInfoData({ ...data, fireTrialId });
      },

      reloadPlanningInfo(): void {
        const fireTrialId = store.fireTrialId();
        if (fireTrialId) dataPlanningService.getFireTrialPlanningInfo(fireTrialId);
      },

      reloadSpecimens(): void {
        dataPlanningService.refreshSpecimens();
        dataPlanningService.getSpecimens();
      },

      reloadUsers(): void {
        dataPlanningService.refreshUsers();
        dataPlanningService.getUsers();
      },

      loadSeries(): void {
        const id = store.fireTrialId();
        if (id) seriesService.getSeriesAndShots(id);
      },

      reloadSeries(): void {
        seriesService.seriesAndShotsResource.reload();
      },

      addSerie(request: AddNewSerieRequest): void {
        seriesService.addNewSerie(request);
      },

      updateSerie(request: UpsertTrialSerieRequest): void {
        seriesService.updateSerie(request);
      },

      deleteSerie(serieId: string): void {
        seriesService.deleteSerie(serieId);
      },

      reorderSeries(request: ReorderSeriesRequest): void {
        seriesService.reorderSeries(request);
      },

      resetAddSerie(): void {
        seriesService.resetAddNewSerie();
      },

      resetUpdateSerie(): void {
        seriesService.resetUpdateSerie();
      },

      addShotToSerie(request: AddShotToSerieRequest): void {
        seriesService.addShotToSerie(request);
      },

      deleteShot(shotId: string): void {
        seriesService.deleteShot(shotId);
      },

      updateShot(request: UpdateShotRequest): void {
        seriesService.updateShot(request);
      },

      reset(): void {
        patchState(store, initialState);
        dataPlanningService.refreshSpecimens();
        dataPlanningService.refreshUsers();
      },

      getShootingConditions(): void {
        const id = store.fireTrialId();
        if (id) shootingConditionsService.getShootingConditions(id);
      },

      updateShootingConditions(request: Omit<UpdateConditionsRequest, 'trialId'>): void {
        const id = store.fireTrialId();
        if (id) shootingConditionsService.updateShootingConditions({ trialId: id, ...request });
      },

      getTargetTypes(): void {
        shootingConditionsService.getTargetTypes();
      },

      getTargetMaterials(): void {
        shootingConditionsService.getTargetMaterials();
      },

      getTargetDimensions(): void {
        shootingConditionsService.getTargetDimensions();
      },

      getTargetThicknesses(): void {
        shootingConditionsService.getTargetThicknesses();
      },

      getImpactZones(): void {
        shootingConditionsService.getImpactZones();
      },

      getSchedules(): void {
        const id = store.fireTrialId();
        if (id) shootingConditionsService.getTrialSchedules(id);
      },
    }),
  ),

  withHooks({
    onInit(store, seriesService = inject(SeriesAndShotsService)) {
      // Whenever the trial has general info loaded, series & shots are
      // auto-loaded so downstream tabs (shooting conditions, munitions,
      // armament, measures) can react to the latest data.
      effect(() => {
        const hasInfo = store.hasPlanningInfo();
        const id = store.fireTrialId();
        if (hasInfo && id) {
          seriesService.getSeriesAndShots(id);
        }
      });
    },
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type PlanningGeneralDataStoreType = InstanceType<typeof PlanningGeneralDataStore>;
