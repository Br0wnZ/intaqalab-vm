import { computed, effect, inject } from '@angular/core';
import { safeResourceValue } from '@intaqalab/utils';
import { patchState, signalStoreFeature, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type {
  ExecutionTechnicalProfile,
  JltPreparationResponse,
  ProfileReadinessFlag,
  ProfileReadinessItem,
  ProfilesReadinessResponse,
} from '../../services/execution.service';
import { ExecutionService } from '../../services/execution.service';
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

function mapJltPreparationToTechUnits(data: JltPreparationResponse): TechUnitStatus[] {
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

// ─── Feature ───────────────────────────────────────────────────────────────────

export function withReadiness() {
  return signalStoreFeature(
    withState(initialState),

    withComputed((store, executionService = inject(ExecutionService)) => ({
      // ── Global Readiness (JLT + Tech) ────────────────────────────────────────
      isReadyForExecution: computed(() => {
        const jlt = store.jltStatus();
        const techReady = store.techUnits().every((u) => u.ready);
        return jlt.sanitary && jlt.security && jlt.boat && techReady;
      }),

      // ── Loading / Saving states expuestos desde los resources ─────────────────
      isLoadingReadiness: computed(() => executionService.profilesReadinessResource.isLoading()),

      isLoadingJltPreparation: computed(() => executionService.jltPreparationResource.isLoading()),

      isSavingReadiness: computed(() => executionService.setProfileReadinessResource.isLoading()),

      isSavingJltPreparation: computed(() => executionService.setJltReadinessResource.isLoading()),

      isSelectingJltShot: computed(() => executionService.selectShotResource.isLoading()),

      isFiringJltShot: computed(() => executionService.fireShotResource.isLoading()),

      readinessLoadError: computed(() => executionService.profilesReadinessResource.error()),

      readinessSaveError: computed(() => executionService.setProfileReadinessResource.error()),
    })),

    withMethods((store, executionService = inject(ExecutionService)) => ({
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
        if (typeof executionService?.getProfilesReadiness === 'function') {
          executionService.getProfilesReadiness(fireTrialId);
        }
      },

      loadJltPreparation(fireTrialId: string, seriesId: string): void {
        executionService.getJltPreparation(fireTrialId, seriesId);
      },

      saveJltReadiness(fireTrialId: string, seriesId: string): void {
        const jlt = store.jltStatus();
        executionService.setJltReadiness(fireTrialId, seriesId, {
          sanitaryServicesReady: jlt.sanitary,
          securityReady: jlt.security,
          vessel: jlt.boat,
          observations: jlt.observations || null,
        });
      },

      selectJltShot(fireTrialId: string, shotId: string): void {
        executionService.selectShot(fireTrialId, shotId);
      },

      fireJltShot(fireTrialId: string): void {
        executionService.fireShot(fireTrialId);
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
      ): Promise<void> {
        const updatedSeries = await executionService.setProfileReadiness(fireTrialId, profile, seriesReadiness);
        const item: ProfileReadinessItem = {
          profile,
          seriesReadiness: updatedSeries,
        };
        const current = store.profilesReadiness() ?? [];
        const idx = current.findIndex((p) => p.profile === item.profile);
        const updated = idx >= 0 ? current.map((p, i) => (i === idx ? item : p)) : [...current, item];

        patchState(store, {
          profilesReadiness: updated,
          techUnits: mapProfilesReadinessToTechUnits(updated),
        });
      },

      /**
       * Resetea el estado del PUT para permitir sucesivos guardados.
       */
      resetSaveProfileReadiness(): void {
        executionService.resetSetProfileReadiness();
      },

      /** Sincroniza profilesReadiness en el store a partir de la respuesta API. */
      _patchProfilesReadiness(data: ProfilesReadinessResponse): void {
        const items = data?.profilesReadiness ?? [];
        patchState(store, {
          profilesReadiness: items,
          techUnits: mapProfilesReadinessToTechUnits(items),
        });
      },

      /** Actualiza solo el perfil que acaba de guardarse (respuesta del PUT). */
      _patchSingleProfile(item: ProfileReadinessItem): void {
        const current = store.profilesReadiness() ?? [];
        const idx = current.findIndex((p) => p.profile === item.profile);
        const updated = idx >= 0 ? current.map((p, i) => (i === idx ? item : p)) : [...current, item];

        patchState(store, {
          profilesReadiness: updated,
          techUnits: mapProfilesReadinessToTechUnits(updated),
        });
      },
    })),

    withHooks({
      onInit(store) {
        const executionService = inject(ExecutionService);

        // ── GET: Sincronizar profilesReadiness cuando llega la respuesta ─────────
        effect(() => {
          const data = safeResourceValue(executionService.profilesReadinessResource);
          if (data) {
            store._patchProfilesReadiness(data);
          }
        });

        // ── W2 GET: Sincronizar estado JLT + unidades técnicas ──────────────────
        effect(() => {
          const data = safeResourceValue(executionService.jltPreparationResource);
          if (data) {
            patchState(store, {
              jltStatus: {
                sanitary: data.jltReadiness?.sanitaryServicesReady ?? false,
                security: data.jltReadiness?.securityReady ?? false,
                boat: data.jltReadiness?.vesselReady ?? false,
                observations: data.jltReadiness?.observations ?? '',
              },
              techUnits: mapJltPreparationToTechUnits(data),
            });
          }
        });

        // ── W2 PUT/POST: recargar estado dinámico tras acciones exitosas ───────
        effect(() => {
          const jltSaveResolved = executionService.setJltReadinessResource.status() === 'resolved';
          const selectShotResolved = executionService.selectShotResource.status() === 'resolved';
          const fireShotResolved = executionService.fireShotResource.status() === 'resolved';
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

        // ── PUT: Actualizar perfil individual tras guardado exitoso ───────────────
        effect(() => {
          if (
            typeof executionService.setProfileReadinessResource?.status === 'function' &&
            executionService.setProfileReadinessResource.status() === 'resolved'
          ) {
            const item = safeResourceValue(executionService.setProfileReadinessResource);
            if (item) {
              store._patchSingleProfile(item);
            }
          }
        });
      },
    }),
  );
}
