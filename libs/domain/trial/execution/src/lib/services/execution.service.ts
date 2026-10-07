import { httpResource } from '@angular/common/http';
import type { Signal } from '@angular/core';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { injectExecutionEndpoint, injectPlanningEndpoint, injectWharehouseEndpoint } from '@intaqalab/config';
import type { AngleUnitEnum, CadenceUnitEnum, DistanceUnitEnum, FireTrial, SpeedUnitEnum } from '@intaqalab/models';
import { filter, firstValueFrom, take } from 'rxjs';

import type {
    EquipmentMeasurementGroup,
    EquipmentSelectionItem,
    EquipmentSelectionList,
    EquipmentTypeEnum,
    JltMaoBulkConfigurationRequest,
    JltMaoBulkConfigurationResponse,
    MaoTopographyBulkConfigurationRequest,
    MaoTopographyBulkConfigurationResponse,
    PropellantChargeParametersResponse,
    ShotAcousticLevelRequest,
    ShotAcousticLevelResponse,
    ShotCameraOrientationResponse,
    ShotDifferentialPressureData,
    ShotJltMaoRequest,
    ShotJltMaoResponse,
    ShotManometerPressuresRequest,
    ShotManometerPressuresResponse,
    ShotMaoTopographyRequest,
    ShotMaoTopographyResponse,
    ShotMunitionRequest,
    ShotMunitionResponse,
    ShotPiezoPressureItem,
    ShotPressuresRequest,
    ShotPressuresResponse,
    ShotTimesData,
    ShotTopographyRequest,
    ShotTopographyResponse,
    ShotTrajectographyRequest,
    ShotTrajectographyResponse,
    ShotVideoDataRequest,
    ShotVideoDataResponse,
    WidgetPreferenceId,
} from '../execution/models';
import type { PiezoPosition } from '../execution/models/shot-piezo-pressures.models';
import { FireTrialLifecycleService } from './fire-trial-lifecycle.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// ============= Types =============

export type ExecutionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'INTERRUPTED'
  | 'CANCELED'
  // Legacy statuses still present in some mock/UI flows.
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'STARTED'
  | 'EXECUTED'
  | 'FINISHED'
  | 'ANALYZING'
  | 'CLOSED';

export interface PlanningComponentType {
  id: string;
  label: string;
  category: string;
}

export interface PlanningDenominationOption {
  id: string;
  name: string;
  componentTypeId: string;
  batch?: string | null;
  clientNumber?: string | null;
}

export interface PlanningComponentData {
  componentTypeId: string;
  denominationId: string | null;
  batch: string | null;
  clientNumber: string | null;
}

export interface PlanningOptionsGroup {
  componentTypes: PlanningComponentType[];
  denominations: PlanningDenominationOption[];
  componentData: Record<string, PlanningComponentData>;
  denominationData: Record<string, PlanningComponentData>;
}

export interface PlanningMunitionOptionData {
  configurationIds: string[];
  componentTypes: PlanningComponentType[];
  denominations: PlanningDenominationOption[];
  optionsBySelection: Record<string, PlanningOptionsGroup>;
  optionsByShot: Record<string, PlanningOptionsGroup>;
  optionsBySeries: Record<string, PlanningOptionsGroup>;
}

export interface ExecutionStateResponse {
  status: ExecutionStatus;
  activeSeriesId: string | null;
  activeShotId: string | null;
  // Backward compatibility with legacy payloads still sending this field.
  activeShootId?: string | null;
  updatedAt: string;
}

export interface ExecutionSeriesProgress {
  seriesId: string;
  shots: ExecutionShotProgress[];
}

export interface ExecutionShotProgress {
  shotId: string;
  status: 'PENDING' | 'ACTIVE' | 'FIRED';
  updatedAt: string;
}

export interface ExecutionProgressResponse {
  series: ExecutionSeriesProgress[];
}

export interface ShotMeasurementWeight {
  balanceId: number | null;
  weight: number | null;
  weightUnit: string | null;
}

export interface ShotMeasurementVelocity {
  radarDopplerId: number;
  antennaId: number;
  initialVelocity: number | null;
  initialVelocityUnit: string | null;
}

export interface ShotMeasurementPiezoPressure {
  position: PiezoPosition;
  piezoelectricSensorId?: number | null;
  amplifierId?: number | null;
  dataAcquisitionSystemId?: number | null;
  maxPressure?: number | null;
  maxPressureUnit?: string | null;
}

export interface ShotMeasurementShot {
  shotId: string;
  powderWeights: ShotMeasurementWeight[];
  projectileWeights: ShotMeasurementWeight[];
  velocities: ShotMeasurementVelocity[];
  piezoPressures: ShotMeasurementPiezoPressure[];
}

export interface ShotMeasurementSeries {
  seriesId: string;
  shots: ShotMeasurementShot[];
}

export interface ShotMeasurementsResponse {
  series: ShotMeasurementSeries[];
}

export type SecurityCountdownStatus = 'INACTIVE' | 'ACTIVE' | 'PAUSED';

export interface SecurityCountdownResponse {
  status: SecurityCountdownStatus;
  targetEndTime: string | null;
  remainingSeconds: number | null;
}

export type SecurityCountdownAction = 'START' | 'PAUSE' | 'RESUME' | 'UPDATE_DURATION';

export interface SecurityCountdownRequest {
  action: SecurityCountdownAction;
  durationSeconds?: number;
}

export interface TransitionWithReasonRequest {
  reason: string;
}

export interface ExecutionFinishResponse {
  finishedAt: string;
}

export interface PlanningSpecimen {
  specimenId: string;
  batch?: string;
}

export interface PlanningUser {
  id: string;
  name: string;
}

export interface DateControlParameters {
  maxEmissionDates: number;
  percentageTechnicalUnits: number;
  percentageEndTrial: number;
  daysSignReport: number;
  reportDeadlineDate: string;
}

export interface PlanningResponse {
  goal: string;
  specimens: PlanningSpecimen[];
  planningUser: PlanningUser;
  executionDate: string;
  observations?: string;
  requirements?: string;
  additionalInfo?: string;
  dateControl?: DateControlParameters;
}

export interface PlanningRequest {
  goal: string;
  specimens: PlanningSpecimen[];
  planningUserId: string;
  executionDate: string;
  observations?: string;
  requirements?: string;
  additionalInfo?: string;
  dateControl?: DateControlParameters;
}

export interface PlanningStateResponse {
  version: number;
  isApprovedByClient: boolean;
  updatedAt: string;
}

export interface PlanningApprovalRequest {
  approved: boolean;
  comments?: string | null;
}

export interface PlanningSeriesItem {
  id: string;
  name: string;
  shotQuantity?: number;
  executionOrder?: number;
  observations?: string;
  shots?: PlanningSeriesShotItem[];
}

export interface PlanningSeriesShotItem {
  id: string;
  globalNumber?: number;
  observation?: string | null;
}

export interface PlanningConditionsResponse {
  units?: {
    orientation?: AngleUnitEnum | null;
  };
  series: PlanningConditionsSeries[];
}

export interface PlanningConditionsSeries {
  seriesId: string;
  shots: PlanningConditionsShot[];
}

export interface PlanningConditionsShot {
  shotId: string;
  orientation?: number | null;
  orientationUnit?: AngleUnitEnum | null;
}

export interface JltShotDataPayload {
  jet: string;
  pieceOperator: string;
  attackDistance: number | null;
  attackDistanceUnit?: DistanceUnitEnum;
  recoilDistance: number | null;
  recoilDistanceUnit?: DistanceUnitEnum;
  observations?: string | null;
}

export type JltShotDataRequest = JltShotDataPayload;

export type JltShotDataResponse = JltShotDataPayload | { jltData: JltShotDataPayload };

export interface ShotVelocityItem {
  radarDopplerId?: number | null;
  antennaId?: number | null;
  initialVelocity?: number | null;
  initialVelocityUnit?: SpeedUnitEnum;
  softwareUncertainty?: number | null;
  softwareUncertaintyUnit?: SpeedUnitEnum;
  cadence?: number | null;
  cadenceUnit?: CadenceUnitEnum;
  velocityLoss?: number | null;
  velocityLossUnit?: SpeedUnitEnum;
  observations?: string | null;
}

export type ShotVelocitiesRequest = ShotVelocityItem[];

export interface ShotVelocitiesResponse {
  velocities: ShotVelocityItem[];
}

// ============= Params Signals =============

interface ExecutionParams {
  fireTrialId: FireTrial['id'];
}

interface ShotVelocitiesParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotVelocitiesUpdateParams extends ShotVelocitiesParams {
  body: ShotVelocitiesRequest;
}

interface ShotMunitionParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotMunitionUpdateParams extends ShotMunitionParams {
  body: ShotMunitionRequest;
}

interface ShotManometerPressuresParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotManometerPressuresUpdateParams extends ShotManometerPressuresParams {
  body: ShotManometerPressuresRequest;
}

interface ShotJltMaoParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotCameraOrientationParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  cameraId: string;
}

interface ShotJltMaoUpdateParams extends ShotJltMaoParams {
  body: ShotJltMaoRequest;
}

interface JltMaoBulkConfigurationParams extends ExecutionParams {
  body: JltMaoBulkConfigurationRequest;
}

interface MaoTopographyBulkConfigurationParams extends ExecutionParams {
  body: MaoTopographyBulkConfigurationRequest;
}

interface ShotMaoTopographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotMaoTopographyUpdateParams extends ShotMaoTopographyParams {
  body: ShotMaoTopographyRequest;
}

interface ShotTopographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotTopographyUpdateParams extends ShotTopographyParams {
  body: ShotTopographyRequest;
}

interface ShotTrajectographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotTrajectographyUpdateParams extends ShotTrajectographyParams {
  body: ShotTrajectographyRequest;
}

interface ShotAcousticLevelParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotAcousticLevelUpdateParams extends ShotAcousticLevelParams {
  body: ShotAcousticLevelRequest;
}

interface ShotVideoDataParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotVideoDataUpdateParams extends ShotVideoDataParams {
  body: ShotVideoDataRequest;
}

// ── SHOT PRESSURES interfaces ────────────────────────────────────────────────

export type ShotPressuresData = ShotPiezoPressureItem;
export type {
    PropellantChargeParametersResponse,
    ShotDifferentialPressureData,
    ShotPiezoPressureItem,
    ShotPressuresRequest,
    ShotPressuresResponse,
    ShotTimesData
};

export interface ArmamentEquipmentItem {
  id: number | string;
  tag: string;
  serialNumber: string;
  denominationId: number;
  denominationName: string;
  modelName: string;
}

export interface PlanningShotArmament {
  weaponExternalId?: number;
  tubeExternalId?: number;
  isInstrumented?: boolean;
  tubeLifePercentage?: number;
  observations?: string;
}

export interface PlanningArmamentResponse {
  series: Array<{
    seriesId: string;
    shots: Array<{ shotId: string; armament?: PlanningShotArmament }>;
  }>;
}

export interface ShotArmamentRequest {
  weaponId: number | null;
  tubeId: number | null;
  observations: string | null;
}

export interface ArmamentBulkConfigurationRequest {
  assignedSeriesIds: string[];
  weaponId?: number | null;
  tubeId?: number | null;
  observations?: string | null;
}

export interface ShotArmamentResponse {
  armamentData?: {
    weapon?: ArmamentEquipmentItem | null;
    tube?: ArmamentEquipmentItem | null;
    observations?: string | null;
  };
}

interface ShotPressuresParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotPressuresUpdateParams extends ShotPressuresParams {
  body: ShotPressuresRequest;
}

interface ShotArmamentUpdateParams extends ShotPressuresParams {
  body: ShotArmamentRequest;
}

interface ArmamentBulkConfigurationParams extends ExecutionParams {
  body: ArmamentBulkConfigurationRequest;
}

interface ExecutionWithReasonParams extends ExecutionParams {
  reason: string;
}

interface SecurityCountdownParams extends ExecutionParams {
  body: SecurityCountdownRequest;
}

interface ExecutionPlanningParams extends ExecutionParams {
  body: PlanningRequest | PlanningApprovalRequest;
}

export type ExecutionTechnicalProfile =
  'VELOCITIES' | 'PRESSURES' | 'VIDEO' | 'TRAJECTOGRAPHY' | 'MUNITIONS' | 'ARMAMENT';

export type ExecutionWidgetLayout = {
  widgetsLayout: WidgetPreferenceId[];
};

export type SeriesReadinessRequest = {
  isReady: boolean;
  observations?: string;
};

export type SeriesReadinessItem = {
  seriesId: string;
  isReady: boolean;
  observations?: string;
};

export type ProfileReadinessItem = {
  profile: ExecutionTechnicalProfile;
  seriesReadiness: SeriesReadinessItem[];
};

export type ProfilesReadinessResponse = {
  profilesReadiness: ProfileReadinessItem[];
};

export type ProfileReadinessRequest = {
  seriesReadiness: SeriesReadinessItem[];
};

export type JltReadinessRequest = {
  sanitaryServicesReady: boolean;
  securityReady: boolean;
  vesselReady: boolean;
  observations?: string | null;
};

export type JltReadinessItem = {
  sanitaryServicesReady: boolean;
  securityReady: boolean;
  vesselReady: boolean;
  observations?: string | null;
};

export type ProfileReadinessFlag = {
  isReady: boolean;
  observations?: string | null;
};

export type TechnicalUnitsReadinessItem = {
  velocities?: ProfileReadinessFlag;
  pressures?: ProfileReadinessFlag;
  video?: ProfileReadinessFlag;
  trajectography?: ProfileReadinessFlag;
  munitions?: ProfileReadinessFlag;
  armament?: ProfileReadinessFlag;
};

export type JltPreparationData = {
  jltReadiness?: JltReadinessItem;
  technicalUnitsReadiness?: TechnicalUnitsReadinessItem;
  seriesIsReadyForExecution: boolean;
};

export type JltPreparationResponse = JltPreparationData | { series: Array<JltPreparationData & { seriesId: string }> };

export type EquipmentSelectorCategory = {
  id: string;
  label: string;
  maxSelection: number;
  equipmentType?: string;
};

export type EquipmentSelectorItem = {
  id: string;
  label: string;
  categoryId?: string;
  equipmentType?: string;
};

export type EquipmentSelectorSelection = EquipmentSelectionItem;

export type EquipmentSelectorMagnitudeGroup = EquipmentMeasurementGroup;

export type EquipmentSelectorResponse = EquipmentSelectionList;

export type EquipmentSelectorUpdateRequest = EquipmentSelectionList;

export type EquipmentSelectorUpdateResponse = void;

interface PreferencesParams extends ExecutionParams {
  roleName?: string;
  username?: string;
  widgetsLayout?: WidgetPreferenceId[];
}

interface EquipmentSelectorUpdateParams extends ExecutionParams {
  body: EquipmentSelectorUpdateRequest;
}

interface JltShotDataParams extends ExecutionParams {
  seriesId: string;
  shotId: string;
}

interface JltShotDataUpdateParams extends JltShotDataParams {
  body: JltShotDataRequest;
}

interface JltPreparationParams extends ExecutionParams {
  seriesId: string;
}

interface JltReadinessParams extends JltPreparationParams {
  body: JltReadinessRequest;
}

interface SelectShotParams extends ExecutionParams {
  shotId: string;
}

interface SeriesReadinessOneParams {
  fireTrialId: FireTrial['id'];
  profile: ExecutionTechnicalProfile;
  seriesId: string;
  body: SeriesReadinessRequest;
}

interface EquipmentByCategoryParams {
  categoryId: string;
}

interface LoadEquipmentByTypeParams {
  itemType: 'WEAPON' | 'TUBE';
}

// ============= Service =============

@Injectable({
  providedIn: 'root',
})
export class ExecutionService {
  readonly #lifecycleService = inject(FireTrialLifecycleService);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #warehouseUrl = injectWharehouseEndpoint();

  readonly #planningMunitionsParams = signal<ExecutionParams | null>(null);
  readonly #componentTypesParams = signal<{ pageSize: number; active: boolean } | null>(null);
  readonly #warehouseDenominationsParams = signal<{
    pageSize: number;
    active: boolean;
    munitionTypeId?: string;
  } | null>(null);

  readonly #planningMunitionsResource = httpResource<unknown>(() => {
    const params = this.#planningMunitionsParams();
    if (!params) return undefined;
    return { url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/munitions`, method: 'GET' };
  });

  readonly #componentTypesResource = httpResource<unknown>(() => {
    const params = this.#componentTypesParams();
    if (!params) return undefined;
    return {
      url: `${this.#warehouseUrl}/munition-types`,
      params: { pageSize: params.pageSize, active: params.active },
      method: 'GET',
    };
  });

  readonly warehouseDenominationsResource = httpResource<unknown>(() => {
    const params = this.#warehouseDenominationsParams();
    if (!params) return undefined;
    const queryParams: Record<string, string | number | boolean> = {
      pageSize: params.pageSize,
      active: params.active,
    };
    if (params.munitionTypeId) {
      queryParams['munitionTypeId'] = params.munitionTypeId;
    }
    return {
      url: `${this.#warehouseUrl}/denominations`,
      params: queryParams,
      method: 'GET',
    };
  });

  async fetchWarehouseDenominations(munitionTypeId?: string): Promise<PlanningDenominationOption[]> {
    this.#warehouseDenominationsParams.set({
      pageSize: 100,
      active: true,
      munitionTypeId: munitionTypeId?.trim() || undefined,
    });
    await this.#awaitResource(this.warehouseDenominationsResource);
    const catalog = this.#catalogItems(this.warehouseDenominationsResource.value());
    const denominations: PlanningDenominationOption[] = [];

    catalog.forEach((item) => {
      if (!isRecord(item) || typeof item['id'] !== 'string') return;
      const name =
        typeof item['name'] === 'string'
          ? item['name']
          : isRecord(item['name']) && typeof item['name']['es'] === 'string'
            ? item['name']['es']
            : item['id'];
      const compTypeId =
        isRecord(item['munitionType']) && typeof item['munitionType']['id'] === 'string'
          ? item['munitionType']['id']
          : (munitionTypeId ?? '');

      if (!munitionTypeId || compTypeId === munitionTypeId) {
        denominations.push({
          id: item['id'],
          name,
          componentTypeId: compTypeId,
          batch: null,
          clientNumber: null,
        });
      }
    });

    return denominations;
  }

  async fetchPlanningMunitionOptions(fireTrialId: FireTrial['id']): Promise<PlanningMunitionOptionData> {
    this.#componentTypesParams.set({ pageSize: 100, active: true });
    this.#warehouseDenominationsParams.set({ pageSize: 100, active: true });
    this.#planningMunitionsParams.set({ fireTrialId });
    await Promise.all([
      this.#awaitResource(this.#componentTypesResource),
      this.#awaitResource(this.warehouseDenominationsResource),
      this.#awaitResource(this.#planningMunitionsResource),
    ]);

    const response = this.#planningMunitionsResource.value();
    const componentTypeCatalog = this.#catalogItems(this.#componentTypesResource.value());
    const componentTypeMap = new Map<string, { label: string; category: string }>();
    componentTypeCatalog.forEach((item) => {
      if (!isRecord(item) || typeof item['id'] !== 'string') return;
      const label =
        typeof item['label'] === 'string' && item['label']
          ? item['label']
          : isRecord(item['name']) && typeof item['name']['es'] === 'string'
            ? item['name']['es']
            : typeof item['name'] === 'string'
              ? item['name']
              : item['id'];
      const category = typeof item['category'] === 'string' ? item['category'] : '';
      componentTypeMap.set(item['id'], { label, category });
    });

    const warehouseDenominationsByType = new Map<string, PlanningDenominationOption[]>();
    const warehouseDenominationsCatalog = this.#catalogItems(this.warehouseDenominationsResource.value());
    warehouseDenominationsCatalog.forEach((item) => {
      if (!isRecord(item) || typeof item['id'] !== 'string') return;
      const name =
        typeof item['name'] === 'string'
          ? item['name']
          : isRecord(item['name']) && typeof item['name']['es'] === 'string'
            ? item['name']['es']
            : item['id'];
      const compTypeId =
        isRecord(item['munitionType']) && typeof item['munitionType']['id'] === 'string'
          ? item['munitionType']['id']
          : '';
      if (compTypeId) {
        const list = warehouseDenominationsByType.get(compTypeId) ?? [];
        list.push({
          id: item['id'],
          name,
          componentTypeId: compTypeId,
          batch: null,
          clientNumber: null,
        });
        warehouseDenominationsByType.set(compTypeId, list);
      }
    });

    const root = isRecord(response) ? response : {};
    const seriesList = Array.isArray(root['series']) ? root['series'] : [];

    const configurationIds: string[] = [];
    const globalComponentTypes = new Map<string, PlanningComponentType>();
    const globalDenominations = new Map<string, PlanningDenominationOption>();
    const optionsBySelection: PlanningMunitionOptionData['optionsBySelection'] = {};
    const optionsByShot: PlanningMunitionOptionData['optionsByShot'] = {};
    const optionsBySeries: PlanningMunitionOptionData['optionsBySeries'] = {};

    seriesList.forEach((serieItem) => {
      if (!isRecord(serieItem)) return;
      const seriesId = typeof serieItem['seriesId'] === 'string' ? serieItem['seriesId'] : '';
      const configurations = Array.isArray(serieItem['configurations']) ? serieItem['configurations'] : [];
      const serieComponentTypes = new Map<string, PlanningComponentType>();
      const serieDenominations = new Map<string, PlanningDenominationOption>();
      const serieComponentData: Record<string, PlanningComponentData> = {};
      const serieDenomData: Record<string, PlanningComponentData> = {};

      configurations.forEach((configuration) => {
        if (!isRecord(configuration)) return;
        if (typeof configuration['id'] === 'string') {
          configurationIds.push(configuration['id']);
        }
        const localTypes = new Map<string, PlanningComponentType>();
        const localDenominations = new Map<string, PlanningDenominationOption>();
        const localComponentData: Record<string, PlanningComponentData> = {};
        const localDenomData: Record<string, PlanningComponentData> = {};

        const configDenom = configuration['denomination'];
        const configBatch = this.#extractBatch(configDenom, configuration);
        const configClient = this.#extractClient(configDenom, configuration);
        const configMunitionTypeId =
          typeof configuration['munitionTypeId'] === 'string' && configuration['munitionTypeId'].trim() !== ''
            ? configuration['munitionTypeId'].trim()
            : isRecord(configDenom) &&
                typeof configDenom['munitionTypeId'] === 'string' &&
                configDenom['munitionTypeId'].trim() !== ''
              ? configDenom['munitionTypeId'].trim()
              : '';
        const configDenomId =
          isRecord(configDenom) && typeof configDenom['id'] === 'string' && configDenom['id'].trim() !== ''
            ? configDenom['id'].trim()
            : typeof configDenom === 'string' && configDenom.trim() !== ''
              ? configDenom.trim()
              : null;

        if (configMunitionTypeId) {
          const catalogInfo = componentTypeMap.get(configMunitionTypeId);
          const label = catalogInfo?.label ?? configMunitionTypeId;
          const category = catalogInfo?.category ?? 'MUNITION';
          const entry: PlanningComponentType = { id: configMunitionTypeId, label, category };
          localTypes.set(configMunitionTypeId, entry);
          serieComponentTypes.set(configMunitionTypeId, entry);
          globalComponentTypes.set(configMunitionTypeId, entry);

          if (configDenomId) {
            const denomName =
              isRecord(configDenom) && typeof configDenom['name'] === 'string' ? configDenom['name'] : configDenomId;
            const denomItem: PlanningDenominationOption = {
              id: configDenomId,
              name: denomName,
              componentTypeId: configMunitionTypeId,
              batch: configBatch,
              clientNumber: configClient,
            };
            localDenominations.set(denomItem.id, denomItem);
            serieDenominations.set(denomItem.id, denomItem);
            globalDenominations.set(denomItem.id, denomItem);

            const compData: PlanningComponentData = {
              componentTypeId: configMunitionTypeId,
              denominationId: denomItem.id,
              batch: configBatch,
              clientNumber: configClient,
            };
            localComponentData[configMunitionTypeId] = compData;
            localDenomData[denomItem.id] = compData;
            serieComponentData[configMunitionTypeId] = compData;
            serieDenomData[denomItem.id] = compData;
          } else {
            const matchingDenoms = warehouseDenominationsByType.get(configMunitionTypeId) ?? [];
            matchingDenoms.forEach((denom) => {
              localDenominations.set(denom.id, denom);
              serieDenominations.set(denom.id, denom);
              globalDenominations.set(denom.id, denom);
            });

            const compData: PlanningComponentData = {
              componentTypeId: configMunitionTypeId,
              denominationId: null,
              batch: configBatch,
              clientNumber: configClient,
            };
            localComponentData[configMunitionTypeId] = compData;
            serieComponentData[configMunitionTypeId] = compData;
          }
        }

        if (Array.isArray(configuration['components'])) {
          configuration['components'].forEach((component) => {
            if (!isRecord(component)) return;
            const type = isRecord(component['type']) ? component['type'] : undefined;
            const compTypeId =
              type && typeof type['id'] === 'string' && type['id'].trim() !== ''
                ? type['id'].trim()
                : typeof component['munitionTypeId'] === 'string' && component['munitionTypeId'].trim() !== ''
                  ? component['munitionTypeId'].trim()
                  : null;
            if (!compTypeId) return;

            const catalogInfo = componentTypeMap.get(compTypeId);
            const compLabel =
              type && typeof type['label'] === 'string' && type['label']
                ? type['label']
                : (catalogInfo?.label ?? compTypeId);
            const compCategory =
              catalogInfo?.category || (type && typeof type['type'] === 'string' ? type['type'] : 'MUNITION_COMPONENT');
            const entry: PlanningComponentType = { id: compTypeId, label: compLabel, category: compCategory };

            localTypes.set(compTypeId, entry);
            serieComponentTypes.set(compTypeId, entry);
            globalComponentTypes.set(compTypeId, entry);

            const denomination = component['denomination'];
            const compBatch = this.#extractBatch(denomination, component);
            const compClient = this.#extractClient(denomination, component);
            const compDenomId =
              isRecord(denomination) && typeof denomination['id'] === 'string' && denomination['id'].trim() !== ''
                ? denomination['id'].trim()
                : typeof denomination === 'string' && denomination.trim() !== ''
                  ? denomination.trim()
                  : null;

            if (compDenomId) {
              const denomName =
                isRecord(denomination) && typeof denomination['name'] === 'string' ? denomination['name'] : compDenomId;
              const item: PlanningDenominationOption = {
                id: compDenomId,
                name: denomName,
                componentTypeId: compTypeId,
                batch: compBatch,
                clientNumber: compClient,
              };
              localDenominations.set(item.id, item);
              serieDenominations.set(item.id, item);
              globalDenominations.set(item.id, item);
            } else {
              const matchingDenoms = warehouseDenominationsByType.get(compTypeId) ?? [];
              matchingDenoms.forEach((denom) => {
                localDenominations.set(denom.id, denom);
                serieDenominations.set(denom.id, denom);
                globalDenominations.set(denom.id, denom);
              });
            }

            const compData: PlanningComponentData = {
              componentTypeId: compTypeId,
              denominationId: compDenomId,
              batch: compBatch,
              clientNumber: compClient,
            };
            localComponentData[compTypeId] = compData;
            if (compDenomId) {
              localDenomData[compDenomId] = compData;
              serieDenomData[compDenomId] = compData;
            }
            serieComponentData[compTypeId] = compData;
          });
        }

        const configSeriesId =
          typeof configuration['seriesId'] === 'string' && configuration['seriesId']
            ? configuration['seriesId']
            : seriesId;
        const shotIds = Array.isArray(configuration['assignedShotIds']) ? configuration['assignedShotIds'] : [];
        shotIds
          .filter((shotId): shotId is string => typeof shotId === 'string')
          .forEach((shotId) => {
            const shotOptions: PlanningOptionsGroup = {
              componentTypes: [...localTypes.values()],
              denominations: [...localDenominations.values()],
              componentData: { ...localComponentData },
              denominationData: { ...localDenomData },
            };
            if (configSeriesId) {
              optionsBySelection[`${configSeriesId}|${shotId}`] = shotOptions;
            }
            optionsByShot[shotId] = shotOptions;
          });
      });

      if (seriesId) {
        optionsBySeries[seriesId] = {
          componentTypes: [...serieComponentTypes.values()],
          denominations: [...serieDenominations.values()],
          componentData: { ...serieComponentData },
          denominationData: { ...serieDenomData },
        };
      }
    });

    return {
      configurationIds,
      componentTypes: [...globalComponentTypes.values()],
      denominations: [...globalDenominations.values()],
      optionsBySelection,
      optionsByShot,
      optionsBySeries,
    };
  }

  #extractBatch(...sources: unknown[]): string | null {
    for (const src of sources) {
      if (isRecord(src)) {
        if (typeof src['batch'] === 'string' && src['batch'].trim()) return src['batch'].trim();
        if (typeof src['lote'] === 'string' && src['lote'].trim()) return src['lote'].trim();
        if (typeof src['lotNumber'] === 'string' && src['lotNumber'].trim()) return src['lotNumber'].trim();
      }
    }
    return null;
  }

  #extractClient(...sources: unknown[]): string | null {
    for (const src of sources) {
      if (isRecord(src)) {
        if (typeof src['clientNumber'] === 'string' && src['clientNumber'].trim()) return src['clientNumber'].trim();
        if (typeof src['clientNumber'] === 'number') return String(src['clientNumber']);
        if (typeof src['client'] === 'string' && src['client'].trim()) return src['client'].trim();
        if (typeof src['client'] === 'number') return String(src['client']);
        if (isRecord(src['client'])) {
          if (typeof src['client']['name'] === 'string' && src['client']['name'].trim())
            return src['client']['name'].trim();
          if (typeof src['client']['id'] === 'string' && src['client']['id'].trim()) return src['client']['id'].trim();
        }
        if (typeof src['numeroCliente'] === 'string' && src['numeroCliente'].trim()) return src['numeroCliente'].trim();
        if (typeof src['numeroCliente'] === 'number') return String(src['numeroCliente']);
        if (typeof src['customer'] === 'string' && src['customer'].trim()) return src['customer'].trim();
      }
    }
    return null;
  }

  #catalogItems(value: unknown): Record<string, unknown>[] {
    if (Array.isArray(value)) return value.filter(isRecord);
    if (!isRecord(value) || !Array.isArray(value['items'])) return [];
    return value['items'].filter(isRecord);
  }

  // ── PLANNING SERIES ──────────────────────────────────────────────────────

  readonly #getPlanningSeriesParams = signal<ExecutionParams | null>(null);

  readonly planningSeriesResource = httpResource<PlanningSeriesItem[]>(() => {
    const params = this.#getPlanningSeriesParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/series`,
      method: 'GET',
    };
  });

  getPlanningSeries(fireTrialId: FireTrial['id']): void {
    this.#getPlanningSeriesParams.set({ fireTrialId });
  }

  readonly #getPlanningConditionsParams = signal<ExecutionParams | null>(null);

  readonly planningConditionsResource = httpResource<PlanningConditionsResponse>(() => {
    const params = this.#getPlanningConditionsParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/conditions`,
      method: 'GET',
    };
  });

  getPlanningConditions(fireTrialId: FireTrial['id']): void {
    this.#getPlanningConditionsParams.set({ fireTrialId });
  }

  // ── PLANNING PROPELLING CHARGE PARAMETERS (Widget 9) ──────────────────────

  readonly #getPropellingChargeParametersParams = signal<ExecutionParams | null>(null);

  readonly propellingChargeParametersResource = httpResource<PropellantChargeParametersResponse>(() => {
    const params = this.#getPropellingChargeParametersParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/propelling-charge-parameters`,
      method: 'GET',
    };
  });

  getPropellingChargeParameters(fireTrialId: FireTrial['id']): void {
    this.#getPropellingChargeParametersParams.set({ fireTrialId });
  }

  readonly #fetchPropellingChargeParametersParams = signal<ExecutionParams | null>(null);

  readonly #fetchPropellingChargeParametersResource = httpResource<PropellantChargeParametersResponse>(() => {
    const p = this.#fetchPropellingChargeParametersParams();
    if (!p) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${p.fireTrialId}/planning/propelling-charge-parameters`,
      method: 'GET',
    };
  });

  async fetchPropellingChargeParameters(fireTrialId: FireTrial['id']): Promise<PropellantChargeParametersResponse> {
    this.#fetchPropellingChargeParametersParams.set({ fireTrialId });
    return this.#awaitResourceValue(this.#fetchPropellingChargeParametersResource);
  }

  // ── EXECUTION STATE ENDPOINTS ───────────────────────────────────────────

  readonly #getExecutionStateParams = signal<ExecutionParams | null>(null);

  readonly executionStateResource = httpResource<ExecutionStateResponse>(() => {
    const params = this.#getExecutionStateParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/state`,
      method: 'GET',
    };
  });

  getExecutionState(fireTrialId: FireTrial['id']): void {
    this.#getExecutionStateParams.set({ fireTrialId });
  }

  // ── EXECUTION PROGRESS ───────────────────────────────────────────────────

  readonly #getExecutionProgressParams = signal<ExecutionParams | null>(null);

  readonly executionProgressResource = httpResource<ExecutionProgressResponse>(() => {
    const params = this.#getExecutionProgressParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/progress`,
      method: 'GET',
    };
  });

  getExecutionProgress(fireTrialId: FireTrial['id']): void {
    this.#getExecutionProgressParams.set({ fireTrialId });
  }

  // ── SHOT MEASUREMENTS (Widget 8) ────────────────────────────────────────

  readonly #getShotMeasurementsParams = signal<ExecutionParams | null>(null);

  readonly shotMeasurementsResource = httpResource<ShotMeasurementsResponse>(() => {
    const params = this.#getShotMeasurementsParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/shot-measurements`,
      method: 'GET',
    };
  });

  getShotMeasurements(fireTrialId: FireTrial['id']): void {
    this.#getShotMeasurementsParams.set({ fireTrialId });
  }

  // ── SECURITY COUNTDOWN STATE ────────────────────────────────────────────

  readonly #getSecurityCountdownParams = signal<ExecutionParams | null>(null);

  readonly securityCountdownResource = httpResource<SecurityCountdownResponse>(() => {
    const params = this.#getSecurityCountdownParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/security-countdown`,
      method: 'GET',
    };
  });

  getSecurityCountdownState(fireTrialId: FireTrial['id']): void {
    this.#getSecurityCountdownParams.set({ fireTrialId });
  }

  // ── SECURITY COUNTDOWN UPDATE ───────────────────────────────────────────

  readonly #updateSecurityCountdownParams = signal<SecurityCountdownParams | null>(null);

  readonly updateSecurityCountdownResource = httpResource<SecurityCountdownResponse>(() => {
    const params = this.#updateSecurityCountdownParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/security-countdown`,
      method: 'PUT',
      body: params.body,
    };
  });

  updateSecurityCountdown(fireTrialId: FireTrial['id'], body: SecurityCountdownRequest): void {
    this.#updateSecurityCountdownParams.set({ fireTrialId, body });
  }

  // ── EXECUTION TRANSITIONS: START ─────────────────────────────────────────

  readonly startResource = this.#lifecycleService.startResource;

  startExecution(fireTrialId: FireTrial['id']): void {
    this.#lifecycleService.startFireTrial(fireTrialId);
  }

  // ── EXECUTION TRANSITIONS: PAUSE ─────────────────────────────────────────

  readonly #pauseParams = signal<ExecutionParams | null>(null);

  readonly pauseResource = httpResource<void>(() => {
    const params = this.#pauseParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/pause`,
      method: 'POST',
    };
  });

  pauseExecution(fireTrialId: FireTrial['id']): void {
    this.#pauseParams.set({ fireTrialId });
  }

  // ── EXECUTION TRANSITIONS: INTERRUPT ────────────────────────────────────

  readonly #interruptParams = signal<ExecutionWithReasonParams | null>(null);

  readonly interruptResource = httpResource<void>(() => {
    const params = this.#interruptParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/interrupt`,
      method: 'POST',
      body: { reason: params.reason } satisfies TransitionWithReasonRequest,
    };
  });

  interruptExecution(fireTrialId: FireTrial['id'], reason: string): void {
    this.#interruptParams.set({ fireTrialId, reason });
  }

  // ── EXECUTION TRANSITIONS: RESUME ───────────────────────────────────────

  readonly #resumeParams = signal<ExecutionParams | null>(null);

  readonly resumeResource = httpResource<void>(() => {
    const params = this.#resumeParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/resume`,
      method: 'POST',
    };
  });

  resumeExecution(fireTrialId: FireTrial['id']): void {
    this.#resumeParams.set({ fireTrialId });
  }

  // ── EXECUTION TRANSITIONS: CANCEL ───────────────────────────────────────

  readonly cancelResource = this.#lifecycleService.cancelResource;

  cancelExecution(fireTrialId: FireTrial['id'], reason: string): void {
    this.#lifecycleService.cancelFireTrial(fireTrialId, reason);
  }

  // ── EXECUTION TRANSITIONS: FINISH ────────────────────────────────────────

  readonly finishResource = this.#lifecycleService.finishResource;

  finishExecution(fireTrialId: FireTrial['id']): void {
    this.#lifecycleService.finishFireTrial(fireTrialId);
  }

  // ── EXECUTION PLANNING: GET ─────────────────────────────────────────────

  readonly #getPlanningParams = signal<ExecutionParams | null>(null);

  readonly planningResource = httpResource<PlanningResponse>(() => {
    const params = this.#getPlanningParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning`,
      method: 'GET',
    };
  });

  getExecutionPlanning(fireTrialId: FireTrial['id']): void {
    this.#getPlanningParams.set({ fireTrialId });
  }

  // ── EXECUTION PLANNING: UPDATE ──────────────────────────────────────────

  readonly #updatePlanningParams = signal<ExecutionPlanningParams | null>(null);

  readonly updatePlanningResource = httpResource<PlanningResponse>(() => {
    const params = this.#updatePlanningParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning`,
      method: 'PUT',
      body: params.body as PlanningRequest,
    };
  });

  updateExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningRequest): void {
    this.#updatePlanningParams.set({ fireTrialId, body });
  }

  // ── EXECUTION PLANNING: STATE ───────────────────────────────────────────

  readonly #getPlanningStateParams = signal<ExecutionParams | null>(null);

  readonly planningStateResource = httpResource<PlanningStateResponse>(() => {
    const params = this.#getPlanningStateParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning/state`,
      method: 'GET',
    };
  });

  getExecutionPlanningState(fireTrialId: FireTrial['id']): void {
    this.#getPlanningStateParams.set({ fireTrialId });
  }

  // ── EXECUTION PLANNING: APPROVE ─────────────────────────────────────────

  readonly #approvePlanningParams = signal<ExecutionPlanningParams | null>(null);

  readonly approvePlanningResource = httpResource<void>(() => {
    const params = this.#approvePlanningParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning/approve`,
      method: 'POST',
      body: params.body as PlanningApprovalRequest,
    };
  });

  approveExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningApprovalRequest): void {
    this.#approvePlanningParams.set({ fireTrialId, body });
  }

  // ── WIDGET PREFERENCES: BY ROLE ─────────────────────────────────────────

  readonly #getPreferencesByRoleParams = signal<PreferencesParams | null>(null);

  readonly preferencesByRoleResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#getPreferencesByRoleParams();
    if (!params || !params.roleName) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/roles/${params.roleName}`,
      method: 'GET',
    };
  });

  getPreferencesByRole(fireTrialId: FireTrial['id'], roleName: string): void {
    this.#getPreferencesByRoleParams.set({ fireTrialId, roleName });
  }

  readonly #updatePreferencesByRoleParams = signal<PreferencesParams | null>(null);

  readonly updatePreferencesByRoleResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#updatePreferencesByRoleParams();
    if (!params || !params.roleName || !params.widgetsLayout) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/roles/${params.roleName}`,
      method: 'PUT',
      body: { widgetsLayout: params.widgetsLayout } satisfies ExecutionWidgetLayout,
    };
  });

  updatePreferencesByRole(fireTrialId: FireTrial['id'], roleName: string, widgetsLayout: WidgetPreferenceId[]): void {
    this.#updatePreferencesByRoleParams.set({ fireTrialId, roleName, widgetsLayout });
  }

  // ── WIDGET PREFERENCES: BY USER ─────────────────────────────────────────

  readonly #getPreferencesByUserParams = signal<PreferencesParams | null>(null);

  readonly preferencesByUserResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#getPreferencesByUserParams();
    if (!params || !params.username) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/users/${params.username}`,
      method: 'GET',
    };
  });

  getPreferencesByUser(fireTrialId: FireTrial['id'], username: string): void {
    this.#getPreferencesByUserParams.set({ fireTrialId, username });
  }

  readonly #updatePreferencesByUserParams = signal<PreferencesParams | null>(null);

  readonly updatePreferencesByUserResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#updatePreferencesByUserParams();
    if (!params || !params.username || !params.widgetsLayout) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/users/${params.username}`,
      method: 'PUT',
      body: { widgetsLayout: params.widgetsLayout } satisfies ExecutionWidgetLayout,
    };
  });

  updatePreferencesByUser(fireTrialId: FireTrial['id'], username: string, widgetsLayout: WidgetPreferenceId[]): void {
    this.#updatePreferencesByUserParams.set({ fireTrialId, username, widgetsLayout });
  }

  // ── EXECUTION READINESS: GET ALL ────────────────────────────────────────

  readonly #getReadinessParams = signal<ExecutionParams | null>(null);

  readonly profilesReadinessResource = httpResource<ProfilesReadinessResponse>(() => {
    const params = this.#getReadinessParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/readiness`,
      method: 'GET',
    };
  });

  getProfilesReadiness(fireTrialId: FireTrial['id']): void {
    this.#getReadinessParams.set({ fireTrialId });
  }

  // ── EXECUTION READINESS: SET BY PROFILE & SERIES ────────────────────────

  readonly #setSeriesReadinessOneParams = signal<SeriesReadinessOneParams | null>(null);

  // Única llamada real de guardado: PUT por perfil + serie (una petición por serie).
  readonly setSeriesReadinessResource = httpResource<SeriesReadinessItem>(() => {
    const p = this.#setSeriesReadinessOneParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/readiness/profiles/${p.profile}/series/${p.seriesId}`,
      method: 'PUT',
      body: p.body,
    };
  });

  /**
   * Registra el readiness de un perfil para una serie individual en la API.
   */
  async setSeriesProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    seriesId: string,
    body: SeriesReadinessRequest,
  ): Promise<SeriesReadinessItem> {
    this.#setSeriesReadinessOneParams.set({ fireTrialId, profile, seriesId, body });
    return this.#awaitResourceValue(this.setSeriesReadinessResource);
  }

  /**
   * Registra el readiness de un perfil ejecutando una llamada individual por cada serie de forma secuencial.
   */
  async setProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    bodyOrItems: ProfileReadinessRequest | SeriesReadinessItem[],
  ): Promise<SeriesReadinessItem[]> {
    const items = Array.isArray(bodyOrItems) ? bodyOrItems : bodyOrItems.seriesReadiness;
    const results: SeriesReadinessItem[] = [];
    for (const item of items) {
      const result = await this.setSeriesProfileReadiness(fireTrialId, profile, item.seriesId, {
        isReady: item.isReady,
        observations: item.observations,
      });
      results.push(result);
    }
    // Resincroniza el estado global de readiness tras guardar todas las series del perfil.
    this.getProfilesReadiness(fireTrialId);
    return results;
  }

  resetSetProfileReadiness(): void {
    this.#setSeriesReadinessOneParams.set(null);
  }

  // ── EXECUTION READINESS: WIDGET 2 JLT PREPARATION ─────────────────────

  readonly #getJltPreparationParams = signal<JltPreparationParams | null>(null);

  readonly jltPreparationResource = httpResource<JltPreparationResponse>(() => {
    const params = this.#getJltPreparationParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation`,
      method: 'GET',
      params: {
        seriesId: params.seriesId,
      },
    };
  });

  getJltPreparation(fireTrialId: FireTrial['id'], seriesId: string): void {
    this.#getJltPreparationParams.set({ fireTrialId, seriesId });
  }

  readonly #setJltReadinessParams = signal<JltReadinessParams | null>(null);

  readonly setJltReadinessResource = httpResource<JltReadinessItem>(() => {
    const params = this.#setJltReadinessParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation/series/${params.seriesId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setJltReadiness(fireTrialId: FireTrial['id'], seriesId: string, body: JltReadinessRequest): void {
    this.#setJltReadinessParams.set({ fireTrialId, seriesId, body });
  }

  readonly #selectShotParams = signal<SelectShotParams | null>(null);

  readonly selectShotResource = httpResource<void>(() => {
    const params = this.#selectShotParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation/shots/${params.shotId}/active`,
      method: 'POST',
    };
  });

  selectShot(fireTrialId: FireTrial['id'], shotId: string): void {
    this.#selectShotParams.set({ fireTrialId, shotId });
  }

  readonly #fireShotParams = signal<ExecutionParams | null>(null);

  readonly fireShotResource = httpResource<void>(() => {
    const params = this.#fireShotParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation/fire`,
      method: 'POST',
    };
  });

  fireShot(fireTrialId: FireTrial['id']): void {
    this.#fireShotParams.set({ fireTrialId });
  }

  // ── EQUIPMENT SELECTOR: GET ─────────────────────────────────────────────

  readonly #getEquipmentSelectorParams = signal<ExecutionParams | null>(null);

  readonly equipmentSelectorResource = httpResource<EquipmentSelectorResponse>(() => {
    const params = this.#getEquipmentSelectorParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/equipment-selection`,
      method: 'GET',
    };
  });

  getEquipmentSelector(fireTrialId: FireTrial['id']): void {
    this.#getEquipmentSelectorParams.set({ fireTrialId });
  }

  // ── EQUIPMENT ITEMS BY CATEGORY ──────────────────────────────────────────

  readonly #loadByCategoryParams = signal<EquipmentByCategoryParams | null>(null);

  readonly #loadByCategoryResource = httpResource<{
    totalElements: number;
    items: Array<{
      id: number | null;
      denominationName: string | null;
      tag: string | null;
    }>;
  }>(() => {
    const p = this.#loadByCategoryParams();
    if (!p) return undefined;
    return {
      url: `${this.#planningUrl}/equipment/items`,
      method: 'GET',
      params: { categoryId: p.categoryId },
    };
  });

  /**
   * Carga items de equipo para múltiples categorías de forma secuencial desde /equipment/items?categoryId=X.
   * Devuelve un map categoryId → opciones de select { id: equipmentItemId, label }.
   */
  async loadEquipmentItemsByCategories(
    categories: EquipmentTypeEnum[],
  ): Promise<Record<string, Array<{ id: string; label: string }>>> {
    const results: Array<readonly [string, Array<{ id: string; label: string }>]> = [];
    for (const cat of categories) {
      this.#loadByCategoryParams.set({ categoryId: cat });
      const response = await this.#awaitResourceValue(this.#loadByCategoryResource);
      results.push([
        cat,
        response.items.map((item) => ({
          id: String(item.id),
          label: `${item.denominationName ?? ''} / ${item.tag ?? ''}`.trim(),
        })),
      ] as const);
    }
    return Object.fromEntries(results);
  }

  // ── EQUIPMENT SELECTOR: PUT ─────────────────────────────────────────────

  readonly #updateEquipmentSelectorParams = signal<EquipmentSelectorUpdateParams | null>(null);

  readonly updateEquipmentSelectorResource = httpResource<EquipmentSelectorUpdateResponse>(() => {
    const params = this.#updateEquipmentSelectorParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/equipment-selection`,
      method: 'PUT',
      body: params.body,
    };
  });

  updateEquipmentSelector(fireTrialId: FireTrial['id'], body: EquipmentSelectorUpdateRequest): void {
    this.#updateEquipmentSelectorParams.set({ fireTrialId, body });
  }

  // ── JLT SHOT DATA: GET ───────────────────────────────────────────────────

  readonly #getJltShotDataParams = signal<JltShotDataParams | null>(null);

  readonly jltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const params = this.#getJltShotDataParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-shot-data/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getJltShotDataParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchJltShotDataParams = signal<JltShotDataParams | null>(null);

  readonly #fetchJltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const p = this.#fetchJltShotDataParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/jlt-shot-data/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<JltShotDataResponse> {
    this.#fetchJltShotDataParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchJltShotDataResource);
  }

  // ── JLT SHOT DATA: PUT ───────────────────────────────────────────────────

  readonly #updateJltShotDataParams = signal<JltShotDataUpdateParams | null>(null);

  readonly updateJltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const params = this.#updateJltShotDataParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-shot-data/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: JltShotDataRequest): void {
    this.#updateJltShotDataParams.set({ fireTrialId, seriesId, shotId, body });
  }

  // ── SHOT VELOCITIES: GET ─────────────────────────────────────────────────

  readonly #getShotVelocitiesParams = signal<ShotVelocitiesParams | null>(null);

  readonly shotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const params = this.#getShotVelocitiesParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/velocities/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotVelocities(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotVelocitiesParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotVelocitiesParams = signal<ShotVelocitiesParams | null>(null);

  readonly #fetchShotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const p = this.#fetchShotVelocitiesParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/velocities/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotVelocities(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotVelocitiesResponse> {
    this.#fetchShotVelocitiesParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotVelocitiesResource);
  }

  // ── SHOT VELOCITIES: PUT ─────────────────────────────────────────────────

  readonly #updateShotVelocitiesParams = signal<ShotVelocitiesUpdateParams | null>(null);

  readonly updateShotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const params = this.#updateShotVelocitiesParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/velocities/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotVelocity(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotVelocitiesRequest): void {
    this.#updateShotVelocitiesParams.set({ fireTrialId, seriesId, shotId, body });
  }

  // ── SHOT PRESSURES: GET ──────────────────────────────────────────────────────

  readonly #getShotPressuresParams = signal<ShotPressuresParams | null>(null);

  readonly shotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const params = this.#getShotPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotPressuresParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotPressuresParams = signal<ShotPressuresParams | null>(null);

  readonly #fetchShotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const p = this.#fetchShotPressuresParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/pressures/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotPressuresResponse> {
    this.#fetchShotPressuresParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotPressuresResource);
  }

  // ── SHOT PRESSURES: PUT ──────────────────────────────────────────────────────

  readonly #updateShotPressuresParams = signal<ShotPressuresUpdateParams | null>(null);

  readonly updateShotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const params = this.#updateShotPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotPressure(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotPressuresRequest): void {
    this.#updateShotPressuresParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotPressuresRequest,
  ): Promise<ShotPressuresResponse> {
    this.#updateShotPressuresParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotPressuresResource);
  }

  // ── SHOT ARMAMENT ───────────────────────────────────────────────────────────

  readonly #loadArmamentItemsParams = signal<LoadEquipmentByTypeParams | null>(null);

  readonly #loadArmamentItemsResource = httpResource<{ items: ArmamentEquipmentItem[] }>(() => {
    const p = this.#loadArmamentItemsParams();
    if (!p) return undefined;
    return {
      url: `${this.#planningUrl}/equipment/items`,
      method: 'GET',
      params: { itemType: p.itemType },
    };
  });

  async loadArmamentEquipmentItems(itemType: 'WEAPON' | 'TUBE'): Promise<ArmamentEquipmentItem[]> {
    this.#loadArmamentItemsParams.set({ itemType });
    const response = await this.#awaitResourceValue(this.#loadArmamentItemsResource);
    return response.items;
  }

  readonly #fetchPlanningArmamentParams = signal<ExecutionParams | null>(null);

  readonly #fetchPlanningArmamentResource = httpResource<PlanningArmamentResponse>(() => {
    const p = this.#fetchPlanningArmamentParams();
    if (!p) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${p.fireTrialId}/planning/armament`,
      method: 'GET',
    };
  });

  async fetchPlanningArmament(fireTrialId: FireTrial['id']): Promise<PlanningArmamentResponse> {
    this.#fetchPlanningArmamentParams.set({ fireTrialId });
    return this.#awaitResourceValue(this.#fetchPlanningArmamentResource);
  }

  readonly #fetchShotArmamentParams = signal<ShotPressuresParams | null>(null);

  readonly #fetchShotArmamentResource = httpResource<ShotArmamentResponse>(() => {
    const p = this.#fetchShotArmamentParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/armament/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotArmament(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotArmamentResponse> {
    this.#fetchShotArmamentParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotArmamentResource);
  }

  readonly #updateShotArmamentParams = signal<ShotArmamentUpdateParams | null>(null);

  readonly updateShotArmamentResource = httpResource<ShotArmamentResponse>(() => {
    const params = this.#updateShotArmamentParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/armament/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotArmament(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotArmamentRequest): void {
    this.#updateShotArmamentParams.set({ fireTrialId, seriesId, shotId, body });
  }

  // ── ARMAMENT BULK CONFIGURATION ──────────────────────────────────────────

  readonly #applyArmamentBulkConfigurationParams = signal<ArmamentBulkConfigurationParams | null>(null);

  readonly applyArmamentBulkConfigurationResource = httpResource<void>(() => {
    const params = this.#applyArmamentBulkConfigurationParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/armament/bulk-configuration`,
      method: 'POST',
      body: params.body,
    };
  });

  applyArmamentBulkConfiguration(fireTrialId: FireTrial['id'], body: ArmamentBulkConfigurationRequest): void {
    this.#applyArmamentBulkConfigurationParams.set({ fireTrialId, body });
  }

  readonly #bulkConfigureArmamentParams = signal<ArmamentBulkConfigurationParams | null>(null);

  readonly #bulkConfigureArmamentResource = httpResource<void>(() => {
    const p = this.#bulkConfigureArmamentParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/armament/bulk-configuration`,
      method: 'POST',
      body: p.body,
    };
  });

  async bulkConfigureArmament(fireTrialId: FireTrial['id'], body: ArmamentBulkConfigurationRequest): Promise<void> {
    this.#bulkConfigureArmamentParams.set({ fireTrialId, body });
    await this.#awaitResource(this.#bulkConfigureArmamentResource);
  }

  // ── SHOT MUNITIONS: GET (Widget 20) ──────────────────────────────────────────

  readonly #getShotMunitionParams = signal<ShotMunitionParams | null>(null);

  readonly shotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const params = this.#getShotMunitionParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/munitions/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotMunitionParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotMunitionParams = signal<ShotMunitionParams | null>(null);

  readonly #fetchShotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const p = this.#fetchShotMunitionParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/munitions/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotMunition(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotMunitionResponse> {
    this.#fetchShotMunitionParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotMunitionResource);
  }

  // ── SHOT MUNITIONS: PUT (Widget 20) ──────────────────────────────────────────

  readonly #updateShotMunitionParams = signal<ShotMunitionUpdateParams | null>(null);

  readonly updateShotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const params = this.#updateShotMunitionParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/munitions/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotMunitionRequest): void {
    this.#updateShotMunitionParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotMunition(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMunitionRequest,
  ): Promise<ShotMunitionResponse> {
    this.#updateShotMunitionParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotMunitionResource);
  }

  // ── SHOT MANOMETER PRESSURES: GET (Widget 21) ────────────────────────────────

  readonly #getShotManometerPressuresParams = signal<ShotManometerPressuresParams | null>(null);

  readonly shotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const params = this.#getShotManometerPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/manometer-pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotManometerPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotManometerPressuresParams = signal<ShotManometerPressuresParams | null>(null);

  readonly #fetchShotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const p = this.#fetchShotManometerPressuresParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/manometer-pressures/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotManometerPressuresResponse> {
    this.#fetchShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotManometerPressuresResource);
  }

  // ── SHOT MANOMETER PRESSURES: PUT (Widget 21) ────────────────────────────────

  readonly #updateShotManometerPressuresParams = signal<ShotManometerPressuresUpdateParams | null>(null);

  readonly updateShotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const params = this.#updateShotManometerPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/manometer-pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): void {
    this.#updateShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): Promise<ShotManometerPressuresResponse> {
    this.#updateShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotManometerPressuresResource);
  }

  // ── SHOT JLT MAO: GET ────────────────────────────────

  readonly #getShotJltMaoParams = signal<ShotJltMaoParams | null>(null);

  readonly shotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const params = this.#getShotJltMaoParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-mao/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotJltMaoResource = this.shotJltMaoResource;

  getShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotJltMaoParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotJltMaoParams = signal<ShotJltMaoParams | null>(null);

  readonly #fetchShotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const p = this.#fetchShotJltMaoParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/jlt-mao/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotJltMaoResponse> {
    this.#fetchShotJltMaoParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotJltMaoResource);
  }

  // ── SHOT JLT MAO: PUT ────────────────────────────────

  readonly #updateShotJltMaoParams = signal<ShotJltMaoUpdateParams | null>(null);

  readonly updateShotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const params = this.#updateShotJltMaoParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-mao/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotJltMaoRequest): void {
    this.#updateShotJltMaoParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotJltMao(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotJltMaoRequest,
  ): Promise<ShotJltMaoResponse> {
    this.#updateShotJltMaoParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotJltMaoResource);
  }

  // ── JLT MAO BULK CONFIGURATION: POST (Widget 15) ─────────────────────────

  readonly #bulkConfigureJltMaoParams = signal<JltMaoBulkConfigurationParams | null>(null);

  readonly #bulkConfigureJltMaoResource = httpResource<JltMaoBulkConfigurationResponse>(() => {
    const params = this.#bulkConfigureJltMaoParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-mao/bulk-configuration`,
      method: 'POST',
      body: params.body,
    };
  });

  async bulkConfigureJltMao(
    fireTrialId: FireTrial['id'],
    body: JltMaoBulkConfigurationRequest,
  ): Promise<JltMaoBulkConfigurationResponse> {
    this.#bulkConfigureJltMaoParams.set({ fireTrialId, body });
    return this.#awaitResourceValue(this.#bulkConfigureJltMaoResource);
  }

  // ── SHOT CAMERA ORIENTATION: GET (Widget 6) ─────────────────────────────

  readonly #getShotCameraOrientationParams = signal<ShotCameraOrientationParams | null>(null);

  readonly shotCameraOrientationResource = httpResource<ShotCameraOrientationResponse>(() => {
    const params = this.#getShotCameraOrientationParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/series/${params.seriesId}/shots/${params.shotId}/cameras/${params.cameraId}/orientation`,
      method: 'GET',
    };
  });

  getShotCameraOrientation(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, cameraId: string): void {
    this.#getShotCameraOrientationParams.set({ fireTrialId, seriesId, shotId, cameraId });
  }

  // ── SHOT MAO TOPOGRAPHY: GET ────────────────────────────────

  readonly #getShotMaoTopographyParams = signal<ShotMaoTopographyParams | null>(null);

  readonly shotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const params = this.#getShotMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/mao-topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotMaoTopographyResource = this.shotMaoTopographyResource;

  getShotMaoTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotMaoTopographyParams = signal<ShotMaoTopographyParams | null>(null);

  readonly #fetchShotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const p = this.#fetchShotMaoTopographyParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/mao-topography/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotMaoTopographyResponse> {
    this.#fetchShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotMaoTopographyResource);
  }

  // ── SHOT MAO TOPOGRAPHY: PUT ────────────────────────────────

  readonly #updateShotMaoTopographyParams = signal<ShotMaoTopographyUpdateParams | null>(null);

  readonly updateShotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const params = this.#updateShotMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/mao-topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): void {
    this.#updateShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): Promise<ShotMaoTopographyResponse> {
    this.#updateShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotMaoTopographyResource);
  }

  // ── MAO TOPOGRAPHY BULK CONFIGURATION: POST (Widget 16) ────────────────

  readonly #bulkConfigureMaoTopographyParams = signal<MaoTopographyBulkConfigurationParams | null>(null);

  readonly #bulkConfigureMaoTopographyResource = httpResource<MaoTopographyBulkConfigurationResponse>(() => {
    const params = this.#bulkConfigureMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/mao-topography/bulk-configuration`,
      method: 'POST',
      body: params.body,
    };
  });

  async bulkConfigureMaoTopography(
    fireTrialId: FireTrial['id'],
    body: MaoTopographyBulkConfigurationRequest,
  ): Promise<MaoTopographyBulkConfigurationResponse> {
    this.#bulkConfigureMaoTopographyParams.set({ fireTrialId, body });
    return this.#awaitResourceValue(this.#bulkConfigureMaoTopographyResource);
  }

  // ── SHOT TOPOGRAPHY: GET ────────────────────────────────

  readonly #getShotTopographyParams = signal<ShotTopographyParams | null>(null);

  readonly shotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const params = this.#getShotTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotTopographyResource = this.shotTopographyResource;

  getShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotTopographyParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotTopographyParams = signal<ShotTopographyParams | null>(null);

  readonly #fetchShotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const p = this.#fetchShotTopographyParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/topography/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotTopographyResponse> {
    this.#fetchShotTopographyParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotTopographyResource);
  }

  // ── SHOT TOPOGRAPHY: PUT ────────────────────────────────

  readonly #updateShotTopographyParams = signal<ShotTopographyUpdateParams | null>(null);

  readonly updateShotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const params = this.#updateShotTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotTopographyRequest): void {
    this.#updateShotTopographyParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTopographyRequest,
  ): Promise<ShotTopographyResponse> {
    this.#updateShotTopographyParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotTopographyResource);
  }

  // ── SHOT TRAJECTOGRAPHY: GET ────────────────────────────────

  readonly #getShotTrajectographyParams = signal<ShotTrajectographyParams | null>(null);

  readonly shotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const params = this.#getShotTrajectographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/trajectography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotTrajectographyResource = this.shotTrajectographyResource;

  getShotTrajectography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotTrajectographyParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotTrajectographyParams = signal<ShotTrajectographyParams | null>(null);

  readonly #fetchShotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const p = this.#fetchShotTrajectographyParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/trajectography/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotTrajectographyResponse> {
    this.#fetchShotTrajectographyParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotTrajectographyResource);
  }

  // ── SHOT TRAJECTOGRAPHY: PUT ────────────────────────────────

  readonly #updateShotTrajectographyParams = signal<ShotTrajectographyUpdateParams | null>(null);

  readonly updateShotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const params = this.#updateShotTrajectographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/trajectography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): void {
    this.#updateShotTrajectographyParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): Promise<ShotTrajectographyResponse> {
    this.#updateShotTrajectographyParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotTrajectographyResource);
  }

  // ── SHOT ACOUSTIC LEVEL: GET ────────────────────────────────

  readonly #getShotAcousticLevelParams = signal<ShotAcousticLevelParams | null>(null);

  readonly shotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const params = this.#getShotAcousticLevelParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/acoustic-level/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotAcousticLevelResource = this.shotAcousticLevelResource;

  getShotAcousticLevel(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotAcousticLevelParams = signal<ShotAcousticLevelParams | null>(null);

  readonly #fetchShotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const p = this.#fetchShotAcousticLevelParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/acoustic-level/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotAcousticLevelResponse> {
    this.#fetchShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotAcousticLevelResource);
  }

  // ── SHOT ACOUSTIC LEVEL: PUT ────────────────────────────────

  readonly #updateShotAcousticLevelParams = signal<ShotAcousticLevelUpdateParams | null>(null);

  readonly updateShotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const params = this.#updateShotAcousticLevelParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/acoustic-level/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): void {
    this.#updateShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): Promise<ShotAcousticLevelResponse> {
    this.#updateShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotAcousticLevelResource);
  }

  // ── SHOT VIDEO DATA: GET ───────────────────────────────────

  readonly #getShotVideoDataParams = signal<ShotVideoDataParams | null>(null);

  readonly shotVideoDataResource = httpResource<ShotVideoDataResponse>(() => {
    const params = this.#getShotVideoDataParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/video/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotVideoData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotVideoDataParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotVideoDataParams = signal<ShotVideoDataParams | null>(null);

  readonly #fetchShotVideoDataResource = httpResource<ShotVideoDataResponse>(() => {
    const params = this.#fetchShotVideoDataParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/video/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotVideoData(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotVideoDataResponse> {
    this.#fetchShotVideoDataParams.set({ fireTrialId, seriesId, shotId });
    return this.#awaitResourceValue(this.#fetchShotVideoDataResource);
  }

  // ── SHOT VIDEO DATA: PUT ───────────────────────────────────

  readonly #updateShotVideoDataParams = signal<ShotVideoDataUpdateParams | null>(null);

  readonly updateShotVideoDataResource = httpResource<ShotVideoDataResponse>(() => {
    const params = this.#updateShotVideoDataParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/video/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotVideoData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotVideoDataRequest): void {
    this.#updateShotVideoDataParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotVideoData(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotVideoDataRequest,
  ): Promise<ShotVideoDataResponse> {
    this.#updateShotVideoDataParams.set({ fireTrialId, seriesId, shotId, body });
    return this.#awaitResourceValue(this.updateShotVideoDataResource);
  }

  /**
   * Espera a que un httpResource complete su carga actual.
   * Detecta la transición de carga y lanza si hay error.
   */
  async #awaitResource(resource: { isLoading: Signal<boolean>; error: Signal<unknown> }): Promise<void> {
    await firstValueFrom(
      toObservable(resource.isLoading, { injector: this.#injector }).pipe(
        filter((_, index) => index > 0 || resource.isLoading()),
        filter((loading) => !loading),
        take(1),
      ),
    );
    if (resource.error()) {
      throw resource.error();
    }
  }

  /**
   * Espera a que un httpResource complete y devuelve su valor de forma segura.
   * Lanza si el recurso reporta error o si el valor resultante es undefined.
   */
  async #awaitResourceValue<T>(resource: {
    isLoading: Signal<boolean>;
    error: Signal<unknown>;
    value: Signal<T | undefined>;
  }): Promise<T> {
    await this.#awaitResource(resource);
    const value = resource.value();
    if (value === undefined) {
      throw new Error('Resource response is undefined');
    }
    return value;
  }
}
