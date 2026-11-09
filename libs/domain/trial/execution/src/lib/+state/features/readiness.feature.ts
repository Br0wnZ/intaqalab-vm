import { computed, effect, inject } from '@angular/core';
import { safeResourceValue } from '@intaqalab/utils';
import { patchState, signalStoreFeature, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import {
  ExecutionReadinessService,
  type ExecutionTechnicalProfile,
  JltPreparationService,
  type ProfileReadinessSaveResult,
} from '../../data-access';
import type {
  JltPreparationData,
  JltPreparationResponse,
  ProfileReadinessFlag,
  ProfileReadinessItem,
  ProfilesReadinessResponse,
} from '../../execution/models';
import type { JltStatus, TechUnitStatus } from '../execution-state.models';

// ─── Mapeo TechProfile (UI) → ExecutionTechnicalProfile (API) ─────────────────

export const TECH_PROFILE_TO_API: Record<string, ExecutionTechnicalProfile> = {
  velocidades: 'VELOCITIES',
  presiones: 'PRESSURES',
  video: 'VIDEO',
  trayectografia: 'TRAJECTOGRAPHY',
  municiones: 'MUNITIONS',
  armamento: 'ARMAMENT',
};

export const API_TO_TECH_PROFILE: Record<ExecutionTechnicalProfile, string> = {
  VELOCITIES: 'velocidades',
  PRESSURES: 'presiones',
  VIDEO: 'video',
  TRAJECTOGRAPHY: 'trayectografia',
  MUNITIONS: 'municiones',
  ARMAMENT: 'armamento',
};

// ─── TechUnitStatus labels por perfil ──────────────────────────────────────────

const TECH_UNIT_LABEL_KEYS: Record<string, string> = {
  velocidades: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VELOCIDADES',
  trayectografia: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.TRAYECTOGRAFIA',
  presiones: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.PRESIONES',
  municiones: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.MUNICIONES',
  video: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VIDEO',
  armamento: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.ARMAMENTO',
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

interface ReadinessSlice {
  /** Datos crudos del API — null hasta que se cargue */
  profilesReadiness: ProfileReadinessItem[] | null;
  techUnits: TechUnitStatus[];
  jltStatus: JltStatus;
}

const initialState: ReadinessSlice = {
  profilesReadiness: null,
  techUnits: [
    { id: 'velocidades', labelKey: TECH_UNIT_LABEL_KEYS['velocidades'], ready: false, observations: '' },
    { id: 'trayectografia', labelKey: TECH_UNIT_LABEL_KEYS['trayectografia'], ready: false, observations: '' },
    { id: 'presiones', labelKey: TECH_UNIT_LABEL_KEYS['presiones'], ready: false, observations: '' },
    { id: 'municiones', labelKey: TECH_UNIT_LABEL_KEYS['municiones'], ready: false, observations: '' },
    { id: 'video', labelKey: TECH_UNIT_LABEL_KEYS['video'], ready: false, observations: '' },
    { id: 'armamento', labelKey: TECH_UNIT_LABEL_KEYS['armamento'], ready: false, observations: '' },
  ],
  jltStatus: {
    sanitary: false,
    security: false,
    boat: false,
    observations: '',
  },
};

// ─── Helper: ProfilesReadinessResponse → techUnits[] ──────────────────────────

function mapProfilesReadinessToTechUnits(profilesReadiness?: ProfileReadinessItem[] | null): TechUnitStatus[] {
  if (!profilesReadiness || !Array.isArray(profilesReadiness)) {
    return initialState.techUnits;
  }
  return Object.entries(TECH_PROFILE_TO_API).map(([uiId, apiProfile]) => {
    const item = profilesReadiness.find((p) => p.profile === apiProfile);
    const allReady = item ? (item.seriesReadiness?.every((s) => s.isReady) ?? false) : false;
    const observations = item?.seriesReadiness
      ? item.seriesReadiness
          .filter((s) => s.observations)
          .map((s) => s.observations)
          .join('; ')
      : '';

    return {
      id: uiId,
      labelKey: TECH_UNIT_LABEL_KEYS[uiId] ?? '',
      ready: allReady,
      observations,
    };
  });
}

function mapFlagToTechUnit(id: string, labelKey: string, flag?: ProfileReadinessFlag): TechUnitStatus {
  return {
    id,
    labelKey,
    ready: flag?.isReady ?? false,
    observations: flag?.observations ?? '',
  };
}

function mapJltPreparationToTechUnits(data: JltPreparationData): TechUnitStatus[] {
  const technical = data.technicalUnitsReadiness;
  return [
    mapFlagToTechUnit('velocidades', TECH_UNIT_LABEL_KEYS['velocidades'], technical?.velocities),
    mapFlagToTechUnit('trayectografia', TECH_UNIT_LABEL_KEYS['trayectografia'], technical?.trajectography),
    mapFlagToTechUnit('presiones', TECH_UNIT_LABEL_KEYS['presiones'], technical?.pressures),
    mapFlagToTechUnit('municiones', TECH_UNIT_LABEL_KEYS['municiones'], technical?.munitions),
    mapFlagToTechUnit('video', TECH_UNIT_LABEL_KEYS['video'], technical?.video),
    mapFlagToTechUnit('armamento', TECH_UNIT_LABEL_KEYS['armamento'], technical?.armament),
  ];
}

function selectJltPreparation(data: JltPreparationResponse, seriesId: string | null): JltPreparationData | null {
  if (!('series' in data)) {
    return data;
  }

  return data.series.find((series) => series.seriesId === seriesId) ?? null;
}

// ─── Feature ───────────────────────────────────────────────────────────────────

export function withReadiness() {
  return signalStoreFeature(
    withState(initialState),

    withComputed(
      (
        store,
        readinessService = inject(ExecutionReadinessService),
        jltPreparationService = inject(JltPreparationService),
      ) => ({
        // ── Global Readiness (JLT + Tech) ────────────────────────────────────────
        isReadyForExecution: computed(() => {
          const jlt = store.jltStatus();
          const techReady = store.techUnits().every((u) => u.ready);
          return jlt.sanitary && jlt.security && jlt.boat && techReady;
        }),

        // ── Loading / Saving states expuestos desde los resources ─────────────────
        isLoadingReadiness: computed(() => readinessService.profilesReadinessResource.isLoading()),

        isLoadingJltPreparation: computed(() => jltPreparationService.jltPreparationResource.isLoading()),

        isSavingReadiness: computed(() => readinessService.setSeriesReadinessResource.isLoading()),

        isSavingJltPreparation: computed(() => jltPreparationService.setJltReadinessResource.isLoading()),

        isSelectingJltShot: computed(() => jltPreparationService.selectShotResource.isLoading()),

        isFiringJltShot: computed(() => jltPreparationService.fireShotResource.isLoading()),

        readinessLoadError: computed(() => readinessService.profilesReadinessResource.error()),

        readinessSaveError: computed(() => readinessService.setSeriesReadinessResource.error()),
      }),
    ),

    withMethods(
      (
        store,
        readinessService = inject(ExecutionReadinessService),
        jltPreparationService = inject(JltPreparationService),
      ) => ({
        // ── Widgets Local State Methods ───────────────────────────────────────────

        updateTechUnit(id: string, updates: Partial<TechUnitStatus>): void {
          patchState(store, (state) => ({
            techUnits: state.techUnits.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          }));
        },

        updateJltStatus(updates: Partial<JltStatus>): void {
          patchState(store, (state) => ({
            jltStatus: { ...state.jltStatus, ...updates },
          }));
        },

        // ── API Methods ───────────────────────────────────────────────────────────

        /** Carga el readiness de todos los perfiles desde la API. */
        loadProfilesReadiness(fireTrialId: string): void {
          if (typeof readinessService?.getProfilesReadiness === 'function') {
            readinessService.getProfilesReadiness(fireTrialId);
          }
        },

        loadJltPreparation(fireTrialId: string, seriesId: string): void {
          jltPreparationService.getJltPreparation(fireTrialId, seriesId);
          jltPreparationService.jltPreparationResource?.reload?.();
        },

        async saveJltReadiness(fireTrialId: string, seriesId: string): Promise<void> {
          const jlt = store.jltStatus();
          const body = {
            sanitaryServicesReady: jlt.sanitary,
            securityReady: jlt.security,
            vesselReady: jlt.boat,
            observations: jlt.observations || null,
          };
          if (typeof jltPreparationService?.updateJltReadiness === 'function') {
            await jltPreparationService.updateJltReadiness(fireTrialId, seriesId, body);
          } else {
            jltPreparationService.setJltReadiness(fireTrialId, seriesId, body);
          }
        },

        selectJltShot(fireTrialId: string, shotId: string): void {
          jltPreparationService.selectShot(fireTrialId, shotId);
        },

        fireJltShot(fireTrialId: string): void {
          jltPreparationService.fireShot(fireTrialId);
        },

        /**
         * Envía peticiones PUT por cada serie para actualizar el readiness de un perfil concreto.
         * @param fireTrialId UUID del ensayo
         * @param profile Perfil técnico en formato API (VELOCITIES, PRESSURES, etc.)
         * @param seriesReadiness Array con el estado de preparación por serie
         */
        async saveProfileReadiness(
          fireTrialId: string,
          profile: ExecutionTechnicalProfile,
          seriesReadiness: Array<{ seriesId: string; isReady: boolean; observations?: string }>,
        ): Promise<ProfileReadinessSaveResult> {
          const result = await readinessService.setProfileReadiness(fireTrialId, profile, seriesReadiness);
          if (result.updatedSeries.length === 0) return result;

          const current = store.profilesReadiness() ?? [];
          const idx = current.findIndex((p) => p.profile === profile);
          const currentSeries = idx >= 0 ? current[idx].seriesReadiness : [];
          const mergedSeriesById = new Map(currentSeries.map((serie) => [serie.seriesId, serie]));
          for (const updatedSerie of result.updatedSeries) {
            mergedSeriesById.set(updatedSerie.seriesId, updatedSerie);
          }
          const item: ProfileReadinessItem = { profile, seriesReadiness: [...mergedSeriesById.values()] };
          const updated = idx >= 0 ? current.map((p, i) => (i === idx ? item : p)) : [...current, item];

          patchState(store, {
            profilesReadiness: updated,
            techUnits: mapProfilesReadinessToTechUnits(updated),
          });
          return result;
        },

        /**
         * Resetea el estado del PUT para permitir sucesivos guardados.
         */
        resetSaveProfileReadiness(): void {
          readinessService.resetSetProfileReadiness();
        },

        /** Sincroniza profilesReadiness en el store a partir de la respuesta API. */
        _patchProfilesReadiness(data: ProfilesReadinessResponse): void {
          const items = data?.profilesReadiness ?? [];
          patchState(store, {
            profilesReadiness: items,
            techUnits: mapProfilesReadinessToTechUnits(items),
          });
        },
      }),
    ),

    withHooks({
      onInit(store) {
        const readinessService = inject(ExecutionReadinessService);
        const jltPreparationService = inject(JltPreparationService);

        // ── GET: Sincronizar profilesReadiness cuando llega la respuesta ─────────
        effect(() => {
          const data = safeResourceValue(readinessService.profilesReadinessResource);
          if (data) {
            store._patchProfilesReadiness(data);
          }
        });

        // ── W2 GET: Sincronizar estado JLT + unidades técnicas ──────────────────
        effect(() => {
          const data = safeResourceValue(jltPreparationService.jltPreparationResource);
          const storeAny = store as unknown as { activeSerieId?: () => string | null };
          const preparation = data ? selectJltPreparation(data, storeAny.activeSerieId?.() ?? null) : null;
          if (preparation) {
            patchState(store, {
              jltStatus: {
                sanitary: preparation.jltReadiness?.sanitaryServicesReady ?? false,
                security: preparation.jltReadiness?.securityReady ?? false,
                boat: preparation.jltReadiness?.vesselReady ?? false,
                observations: preparation.jltReadiness?.observations ?? '',
              },
              techUnits: mapJltPreparationToTechUnits(preparation),
            });
          }
        });

        // ── W2 PUT/POST: recargar estado dinámico tras acciones exitosas ───────
        effect(() => {
          const jltSaveResolved = jltPreparationService.setJltReadinessResource.status() === 'resolved';
          const selectShotResolved = jltPreparationService.selectShotResource.status() === 'resolved';
          const fireShotResolved = jltPreparationService.fireShotResource.status() === 'resolved';
          if (!jltSaveResolved && !selectShotResolved && !fireShotResolved) {
            return;
          }

          const storeAny = store as unknown as {
            fireTrialId?: () => string | null;
            activeSerieId?: () => string | null;
            loadExecutionState?: (id: string) => void;
            loadExecutionProgress?: (id: string) => void;
            loadJltPreparation?: (trialId: string, seriesId: string) => void;
          };

          const trialId = storeAny.fireTrialId?.();
          const serieId = storeAny.activeSerieId?.();

          if (trialId && typeof storeAny.loadExecutionState === 'function') {
            storeAny.loadExecutionState(trialId);
          }
          if (trialId && typeof storeAny.loadExecutionProgress === 'function') {
            storeAny.loadExecutionProgress(trialId);
          }
          if (trialId && serieId && typeof storeAny.loadJltPreparation === 'function') {
            storeAny.loadJltPreparation(trialId, serieId);
          }
        });
      },
    }),
  );
}
