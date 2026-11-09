import { Injectable, inject } from '@angular/core';
import type { FireTrial } from '@intaqalab/models';

import { OverpressureService } from '../data-access/execution/analytics/overpressure.service';
import { PropellantChargeService } from '../data-access/execution/analytics/propellant-charge.service';
import { VelocityUniformityService } from '../data-access/execution/analytics/velocity-uniformity.service';
import { ArmamentCatalogService } from '../data-access/execution/equipment/armament-catalog.service';
import { EquipmentSelectionService } from '../data-access/execution/equipment/equipment-selection.service';
import { PlanningFuseService } from '../data-access/execution/planning/planning-fuse.service';
import { PlanningMunitionOptionsService } from '../data-access/execution/planning/planning-munition-options.service';
import { WarehouseCatalogService } from '../data-access/execution/planning/warehouse-catalog.service';
import { WidgetPreferencesService } from '../data-access/execution/preferences/widget-preferences.service';
import { ExecutionReadinessService } from '../data-access/execution/readiness/execution-readiness.service';
import { JltPreparationService } from '../data-access/execution/readiness/jlt-preparation.service';
import { ShotAcousticLevelService } from '../data-access/execution/shot/shot-acoustic-level.service';
import { ShotArmamentService } from '../data-access/execution/shot/shot-armament.service';
import { ShotCameraOrientationService } from '../data-access/execution/shot/shot-camera-orientation.service';
import { ShotIpgPressuresService } from '../data-access/execution/shot/shot-ipg-pressures.service';
import { ShotJltDataService } from '../data-access/execution/shot/shot-jlt-data.service';
import { ShotJltMaoService } from '../data-access/execution/shot/shot-jlt-mao.service';
import { ShotManometerPressuresService } from '../data-access/execution/shot/shot-manometer-pressures.service';
import { ShotMaoTopographyService } from '../data-access/execution/shot/shot-mao-topography.service';
import { ShotMunitionService } from '../data-access/execution/shot/shot-munition.service';
import { ShotPressuresService } from '../data-access/execution/shot/shot-pressures.service';
import { ShotRadarOrientationService } from '../data-access/execution/shot/shot-radar-orientation.service';
import { ShotTopographyService } from '../data-access/execution/shot/shot-topography.service';
import { ShotTrajectographyService } from '../data-access/execution/shot/shot-trajectography.service';
import { ShotVelocitiesService } from '../data-access/execution/shot/shot-velocities.service';
import { ShotVideoService } from '../data-access/execution/shot/shot-video.service';
import { ExecutionPlanningService } from '../data-access/execution/state/commands/execution-planning.service';
import { ExecutionStateService } from '../data-access/execution/state/execution-state.service';
import { ExecutionTransitionService } from '../data-access/execution/state/execution-transition.service';
import { SecurityCountdownService } from '../data-access/execution/state/security-countdown.service';
import type {
  ArmamentBulkConfigurationRequest,
  ArmamentEquipmentDenomination,
  ArmamentEquipmentItem,
  EquipmentSelectorUpdateRequest,
  EquipmentTypeEnum,
  ExecutionFinishResponse,
  ExecutionTechnicalProfile,
  JltMaoBulkConfigurationRequest,
  JltMaoBulkConfigurationResponse,
  JltReadinessItem,
  JltReadinessRequest,
  JltShotDataRequest,
  JltShotDataResponse,
  LoadEquipmentByTypeParams,
  MaoTopographyBulkConfigurationRequest,
  MaoTopographyBulkConfigurationResponse,
  MunitionConditioningBulkConfigurationRequest,
  MunitionConditioningBulkConfigurationResponse,
  PlanningApprovalRequest,
  PlanningArmamentResponse,
  PlanningDenominationOption,
  PlanningMunitionOptionData,
  PlanningRequest,
  ProfileReadinessRequest,
  ProfileReadinessSaveResult,
  PropellantChargeAdjustmentQuery,
  SecurityCountdownRequest,
  SecurityCountdownResponse,
  SeriesReadinessItem,
  SeriesReadinessRequest,
  ShotAcousticLevelRequest,
  ShotAcousticLevelResponse,
  ShotArmamentRequest,
  ShotArmamentResponse,
  ShotIpgPressuresRequest,
  ShotIpgPressuresResponse,
  ShotJltMaoRequest,
  ShotJltMaoResponse,
  ShotManometerPressuresRequest,
  ShotManometerPressuresResponse,
  ShotMaoTopographyRequest,
  ShotMaoTopographyResponse,
  ShotMunitionRequest,
  ShotMunitionResponse,
  ShotPressuresRequest,
  ShotPressuresResponse,
  ShotTopographyRequest,
  ShotTopographyResponse,
  ShotTrajectographyRequest,
  ShotTrajectographyResponse,
  ShotVelocitiesRequest,
  ShotVelocitiesResponse,
  ShotVideoDataRequest,
  ShotVideoDataResponse,
  TrialOverpressureInfoParams,
  TrialOverpressureInfoRequest,
  TrialOverpressureInfoResponse,
  VelocityUniformityQuery,
  WarehouseStockBatch,
  WidgetPreferenceId,
} from '../execution/models';

// Superficie de tipos compatible: los modelos se movieron a `execution/models` (ADR-025).
export type {
  PropellantChargeParametersResponse,
  ShotDifferentialPressureData,
  ShotPiezoPressureItem,
  ShotPressuresRequest,
  ShotPressuresResponse,
  ShotTimesData,
} from '../execution/models';
export type * from '../execution/models/armament.models';
export type * from '../execution/models/execution-planning.models';
export type * from '../execution/models/execution-preferences.models';
export type * from '../execution/models/execution-readiness.models';
export type * from '../execution/models/execution-runtime.models';
export type * from '../execution/models/jlt-shot-data.models';
export type * from '../execution/models/shot-velocities.models';
export type * from '../execution/models/trial-overpressure-info.models';

/**
 * @deprecated Use specific domain services from `@intaqalab/domain-trial-execution` (data-access/execution/*)
 * instead of this monolithic facade. Will be removed in future version.
 */
@Injectable({
  providedIn: 'root',
})
export class ExecutionService {
  // ── Inyecciones de servicios descompuestos ─────────────────────────────────
  readonly #shotAcousticLevel = inject(ShotAcousticLevelService);
  readonly #shotArmament = inject(ShotArmamentService);
  readonly #shotCameraOrientation = inject(ShotCameraOrientationService);
  readonly #shotIpgPressures = inject(ShotIpgPressuresService);
  readonly #shotJltData = inject(ShotJltDataService);
  readonly #shotJltMao = inject(ShotJltMaoService);
  readonly #shotManometerPressures = inject(ShotManometerPressuresService);
  readonly #shotMaoTopography = inject(ShotMaoTopographyService);
  readonly #shotMunition = inject(ShotMunitionService);
  readonly #shotPressures = inject(ShotPressuresService);
  readonly #shotRadarOrientation = inject(ShotRadarOrientationService);
  readonly #shotTopography = inject(ShotTopographyService);
  readonly #shotTrajectography = inject(ShotTrajectographyService);
  readonly #shotVelocities = inject(ShotVelocitiesService);
  readonly #shotVideo = inject(ShotVideoService);

  readonly #executionState = inject(ExecutionStateService);
  readonly #securityCountdown = inject(SecurityCountdownService);
  readonly #executionTransition = inject(ExecutionTransitionService);
  readonly #executionPlanning = inject(ExecutionPlanningService);
  readonly #readiness = inject(ExecutionReadinessService);
  readonly #jltPreparation = inject(JltPreparationService);
  readonly #preferences = inject(WidgetPreferencesService);
  readonly #equipmentSelection = inject(EquipmentSelectionService);
  readonly #propellantCharge = inject(PropellantChargeService);
  readonly #velocityUniformity = inject(VelocityUniformityService);
  readonly #overpressure = inject(OverpressureService);
  readonly #planningFuse = inject(PlanningFuseService);
  readonly #warehouseCatalog = inject(WarehouseCatalogService);
  readonly #planningMunitionOptions = inject(PlanningMunitionOptionsService);
  readonly #armamentCatalog = inject(ArmamentCatalogService);

  // ── Warehouse & Planning Munitions ─────────────────────────────────────────
  readonly warehouseDenominationsResource = this.#warehouseCatalog.warehouseDenominationsResource;

  fetchAvailableStockBatches(denominationIds: string[]): Promise<WarehouseStockBatch[]> {
    return this.#warehouseCatalog.fetchAvailableStockBatches(denominationIds);
  }

  fetchWarehouseDenominations(munitionTypeId?: string): Promise<PlanningDenominationOption[]> {
    return this.#warehouseCatalog.fetchWarehouseDenominations(munitionTypeId);
  }

  fetchPlanningMunitionOptions(fireTrialId: FireTrial['id']): Promise<PlanningMunitionOptionData> {
    return this.#planningMunitionOptions.fetchPlanningMunitionOptions(fireTrialId);
  }

  fetchPlanningFuseGraduation(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<number | null> {
    return this.#planningFuse.fetchPlanningFuseGraduation(fireTrialId, seriesId, shotId);
  }

  // ── Orientation ────────────────────────────────────────────────────────────
  readonly radarTrayectographyOrientationResource = this.#shotRadarOrientation.radarTrayectographyOrientationResource;

  getRadarTrayectographyOrientation(fireTrialId: FireTrial['id'], radarId: string | null): void {
    this.#shotRadarOrientation.getRadarTrayectographyOrientation(fireTrialId, radarId);
  }

  readonly shotCameraOrientationResource = this.#shotCameraOrientation.shotCameraOrientationResource;

  getShotCameraOrientation(fireTrialId: FireTrial['id'], cameraId: number): void {
    this.#shotCameraOrientation.getShotCameraOrientation(fireTrialId, cameraId);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────
  readonly propellantChargeAdjustmentResource = this.#propellantCharge.propellantChargeAdjustmentResource;

  getPropellantChargeAdjustment(fireTrialId: FireTrial['id'], query: PropellantChargeAdjustmentQuery): void {
    this.#propellantCharge.getPropellantChargeAdjustment(fireTrialId, query);
  }

  readonly propellantChargeAdjustmentConfigurationsResource =
    this.#propellantCharge.propellantChargeAdjustmentConfigurationsResource;

  listPropellantChargeAdjustmentConfigurations(fireTrialId: FireTrial['id']): void {
    this.#propellantCharge.listPropellantChargeAdjustmentConfigurations(fireTrialId);
  }

  readonly velocityUniformityResource = this.#velocityUniformity.velocityUniformityResource;

  getVelocityUniformity(fireTrialId: FireTrial['id'], query: VelocityUniformityQuery): void {
    this.#velocityUniformity.getVelocityUniformity(fireTrialId, query);
  }

  clearVelocityUniformity(): void {
    this.#velocityUniformity.clearVelocityUniformity();
  }

  // ── State, Progress & Countdown ───────────────────────────────────────────
  readonly executionStateResource = this.#executionState.executionStateResource;

  getExecutionState(fireTrialId: FireTrial['id']): void {
    this.#executionState.getExecutionState(fireTrialId);
  }

  readonly executionProgressResource = this.#executionState.executionProgressResource;

  getExecutionProgress(fireTrialId: FireTrial['id']): void {
    this.#executionState.getExecutionProgress(fireTrialId);
  }

  readonly shotMeasurementsResource = this.#executionState.shotMeasurementsResource;

  getShotMeasurements(fireTrialId: FireTrial['id']): void {
    this.#executionState.getShotMeasurements(fireTrialId);
  }

  readonly securityCountdownResource = this.#securityCountdown.securityCountdownResource;

  getSecurityCountdownState(fireTrialId: FireTrial['id']): void {
    this.#securityCountdown.getSecurityCountdownState(fireTrialId);
  }

  updateSecurityCountdown(
    fireTrialId: FireTrial['id'],
    body: SecurityCountdownRequest,
  ): Promise<SecurityCountdownResponse> {
    return this.#securityCountdown.updateSecurityCountdown(fireTrialId, body);
  }

  // ── Transitions ────────────────────────────────────────────────────────────
  startExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return this.#executionTransition.startExecution(fireTrialId);
  }

  pauseExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return this.#executionTransition.pauseExecution(fireTrialId);
  }

  interruptExecution(fireTrialId: FireTrial['id'], reason: string): Promise<void> {
    return this.#executionTransition.interruptExecution(fireTrialId, reason);
  }

  resumeExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return this.#executionTransition.resumeExecution(fireTrialId);
  }

  cancelExecution(fireTrialId: FireTrial['id'], reason: string): Promise<void> {
    return this.#executionTransition.cancelExecution(fireTrialId, reason);
  }

  finishExecution(fireTrialId: FireTrial['id']): Promise<ExecutionFinishResponse> {
    return this.#executionTransition.finishExecution(fireTrialId);
  }

  // ── Planning Commands ──────────────────────────────────────────────────────
  readonly updatePlanningResource = this.#executionPlanning.updatePlanningResource;

  updateExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningRequest): void {
    this.#executionPlanning.updateExecutionPlanning(fireTrialId, body);
  }

  readonly approvePlanningResource = this.#executionPlanning.approvePlanningResource;

  approveExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningApprovalRequest): void {
    this.#executionPlanning.approveExecutionPlanning(fireTrialId, body);
  }

  // ── Widget Preferences ─────────────────────────────────────────────────────
  readonly preferencesByRoleResource = this.#preferences.preferencesByRoleResource;

  getPreferencesByRole(fireTrialId: FireTrial['id'], roleName: string): void {
    this.#preferences.getPreferencesByRole(fireTrialId, roleName);
  }

  readonly updatePreferencesByRoleResource = this.#preferences.updatePreferencesByRoleResource;

  updatePreferencesByRole(fireTrialId: FireTrial['id'], roleName: string, widgetsLayout: WidgetPreferenceId[]): void {
    this.#preferences.updatePreferencesByRole(fireTrialId, roleName, widgetsLayout);
  }

  readonly preferencesByUserResource = this.#preferences.preferencesByUserResource;

  getPreferencesByUser(fireTrialId: FireTrial['id'], username: string): void {
    this.#preferences.getPreferencesByUser(fireTrialId, username);
  }

  readonly updatePreferencesByUserResource = this.#preferences.updatePreferencesByUserResource;

  updatePreferencesByUser(fireTrialId: FireTrial['id'], username: string, widgetsLayout: WidgetPreferenceId[]): void {
    this.#preferences.updatePreferencesByUser(fireTrialId, username, widgetsLayout);
  }

  // ── Execution Readiness ────────────────────────────────────────────────────
  readonly profilesReadinessResource = this.#readiness.profilesReadinessResource;

  getProfilesReadiness(fireTrialId: FireTrial['id']): void {
    this.#readiness.getProfilesReadiness(fireTrialId);
  }

  readonly setSeriesReadinessResource = this.#readiness.setSeriesReadinessResource;

  setSeriesProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    seriesId: string,
    body: SeriesReadinessRequest,
  ): Promise<SeriesReadinessItem> {
    return this.#readiness.setSeriesProfileReadiness(fireTrialId, profile, seriesId, body);
  }

  async setProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    bodyOrItems: ProfileReadinessRequest | SeriesReadinessItem[],
  ): Promise<ProfileReadinessSaveResult> {
    const items = Array.isArray(bodyOrItems) ? bodyOrItems : bodyOrItems.seriesReadiness;
    const result = await this.#readiness.setProfileReadiness(fireTrialId, profile, bodyOrItems);
    if (items.length > 0) {
      this.getProfilesReadiness(fireTrialId);
    }
    return result;
  }

  resetSetProfileReadiness(): void {
    this.#readiness.resetSetProfileReadiness();
  }

  // ── JLT Preparation ────────────────────────────────────────────────────────
  readonly jltPreparationResource = this.#jltPreparation.jltPreparationResource;

  getJltPreparation(fireTrialId: FireTrial['id'], seriesId: string): void {
    this.#jltPreparation.getJltPreparation(fireTrialId, seriesId);
  }

  readonly setJltReadinessResource = this.#jltPreparation.setJltReadinessResource;

  setJltReadiness(fireTrialId: FireTrial['id'], seriesId: string, body: JltReadinessRequest): void {
    this.#jltPreparation.setJltReadiness(fireTrialId, seriesId, body);
  }

  updateJltReadiness(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    body: JltReadinessRequest,
  ): Promise<JltReadinessItem> {
    return this.#jltPreparation.updateJltReadiness(fireTrialId, seriesId, body);
  }

  readonly selectShotResource = this.#jltPreparation.selectShotResource;

  selectShot(fireTrialId: FireTrial['id'], shotId: string): void {
    this.#jltPreparation.selectShot(fireTrialId, shotId);
  }

  readonly fireShotResource = this.#jltPreparation.fireShotResource;

  fireShot(fireTrialId: FireTrial['id']): void {
    this.#jltPreparation.fireShot(fireTrialId);
  }

  // ── Equipment Selection & Armament Catalog ─────────────────────────────────
  readonly equipmentSelectorResource = this.#equipmentSelection.equipmentSelectorResource;

  getEquipmentSelector(fireTrialId: FireTrial['id']): void {
    this.#equipmentSelection.getEquipmentSelector(fireTrialId);
  }

  loadEquipmentItemsByCategories(
    categories: readonly EquipmentTypeEnum[],
  ): Promise<Record<string, Array<{ id: string; label: string }>>> {
    return this.#equipmentSelection.loadEquipmentItemsByCategories(categories);
  }

  readonly updateEquipmentSelectorResource = this.#equipmentSelection.updateEquipmentSelectorResource;

  updateEquipmentSelector(fireTrialId: FireTrial['id'], body: EquipmentSelectorUpdateRequest): void {
    this.#equipmentSelection.updateEquipmentSelector(fireTrialId, body);
  }

  loadArmamentEquipmentItems(itemType: LoadEquipmentByTypeParams['itemType']): Promise<ArmamentEquipmentItem[]> {
    return this.#armamentCatalog.loadArmamentEquipmentItems(itemType);
  }

  loadArmamentWeaponDenominations(): Promise<ArmamentEquipmentDenomination[]> {
    return this.#armamentCatalog.loadArmamentWeaponDenominations();
  }

  loadArmamentDenominations(itemType: 'MORTAR' | 'TUBE', familyId?: number): Promise<ArmamentEquipmentDenomination[]> {
    return this.#armamentCatalog.loadArmamentDenominations(itemType, familyId);
  }

  // ── Shot Pressures ─────────────────────────────────────────────────────────
  readonly shotPressuresResource = this.#shotPressures.shotPressuresResource;

  getShotPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotPressures.getShotPressures(fireTrialId, seriesId, shotId);
  }

  fetchShotPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotPressuresResponse> {
    return this.#shotPressures.fetchShotPressures(fireTrialId, seriesId, shotId);
  }

  readonly updateShotPressuresResource = this.#shotPressures.updateShotPressuresResource;

  setShotPressure(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotPressuresRequest): void {
    this.#shotPressures.setShotPressure(fireTrialId, seriesId, shotId, body);
  }

  updateShotPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotPressuresRequest,
  ): Promise<ShotPressuresResponse> {
    return this.#shotPressures.updateShotPressures(fireTrialId, seriesId, shotId, body);
  }

  // ── Shot Armament ──────────────────────────────────────────────────────────
  async fetchPlanningArmament(fireTrialId: FireTrial['id']): Promise<PlanningArmamentResponse> {
    return this.#shotArmament.fetchPlanningArmament(fireTrialId);
  }

  fetchShotArmament(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotArmamentResponse> {
    return this.#shotArmament.fetchShotArmament(fireTrialId, seriesId, shotId);
  }

  readonly updateShotArmamentResource = this.#shotArmament.updateShotArmamentResource;

  setShotArmament(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotArmamentRequest): void {
    this.#shotArmament.setShotArmament(fireTrialId, seriesId, shotId, body);
  }

  updateShotArmament(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotArmamentRequest,
  ): Promise<ShotArmamentResponse> {
    return this.#shotArmament.updateShotArmament(fireTrialId, seriesId, shotId, body);
  }

  readonly applyArmamentBulkConfigurationResource = this.#shotArmament.applyArmamentBulkConfigurationResource;

  applyArmamentBulkConfiguration(fireTrialId: FireTrial['id'], body: ArmamentBulkConfigurationRequest): void {
    this.#shotArmament.applyArmamentBulkConfiguration(fireTrialId, body);
  }

  // ── Shot Munitions ─────────────────────────────────────────────────────────
  readonly shotMunitionResource = this.#shotMunition.shotMunitionResource;

  getShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotMunition.getShotMunition(fireTrialId, seriesId, shotId);
  }

  fetchShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotMunitionResponse> {
    return this.#shotMunition.fetchShotMunition(fireTrialId, seriesId, shotId);
  }

  readonly updateShotMunitionResource = this.#shotMunition.updateShotMunitionResource;

  setShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotMunitionRequest): void {
    this.#shotMunition.setShotMunition(fireTrialId, seriesId, shotId, body);
  }

  updateShotMunition(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMunitionRequest,
  ): Promise<ShotMunitionResponse> {
    return this.#shotMunition.updateShotMunition(fireTrialId, seriesId, shotId, body);
  }

  readonly applyMunitionConditioningBulkConfigurationResource =
    this.#shotMunition.applyMunitionConditioningBulkConfigurationResource;

  applyMunitionConditioningBulkConfiguration(
    fireTrialId: FireTrial['id'],
    body: MunitionConditioningBulkConfigurationRequest,
  ): Promise<MunitionConditioningBulkConfigurationResponse> {
    return this.#shotMunition.applyMunitionConditioningBulkConfiguration(fireTrialId, body);
  }

  // ── Shot JLT MAO ───────────────────────────────────────────────────────────
  readonly shotJltMaoResource = this.#shotJltMao.shotJltMaoResource;
  readonly shotShotJltMaoResource = this.shotJltMaoResource;

  getShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotJltMao.getShotJltMao(fireTrialId, seriesId, shotId);
  }

  fetchShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotJltMaoResponse> {
    return this.#shotJltMao.fetchShotJltMao(fireTrialId, seriesId, shotId);
  }

  readonly updateShotJltMaoResource = this.#shotJltMao.updateShotJltMaoResource;

  setShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotJltMaoRequest): void {
    this.#shotJltMao.setShotJltMao(fireTrialId, seriesId, shotId, body);
  }

  updateShotJltMao(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotJltMaoRequest,
  ): Promise<ShotJltMaoResponse> {
    return this.#shotJltMao.updateShotJltMao(fireTrialId, seriesId, shotId, body);
  }

  bulkConfigureJltMao(
    fireTrialId: FireTrial['id'],
    body: JltMaoBulkConfigurationRequest,
  ): Promise<JltMaoBulkConfigurationResponse> {
    return this.#shotJltMao.bulkConfigureJltMao(fireTrialId, body);
  }

  // ── Shot MAO Topography ────────────────────────────────────────────────────
  readonly shotMaoTopographyResource = this.#shotMaoTopography.shotMaoTopographyResource;
  readonly shotShotMaoTopographyResource = this.shotMaoTopographyResource;

  getShotMaoTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotMaoTopography.getShotMaoTopography(fireTrialId, seriesId, shotId);
  }

  fetchShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotMaoTopographyResponse> {
    return this.#shotMaoTopography.fetchShotMaoTopography(fireTrialId, seriesId, shotId);
  }

  readonly updateShotMaoTopographyResource = this.#shotMaoTopography.updateShotMaoTopographyResource;

  setShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): void {
    this.#shotMaoTopography.setShotMaoTopography(fireTrialId, seriesId, shotId, body);
  }

  updateShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): Promise<ShotMaoTopographyResponse> {
    return this.#shotMaoTopography.updateShotMaoTopography(fireTrialId, seriesId, shotId, body);
  }

  bulkConfigureMaoTopography(
    fireTrialId: FireTrial['id'],
    body: MaoTopographyBulkConfigurationRequest,
  ): Promise<MaoTopographyBulkConfigurationResponse> {
    return this.#shotMaoTopography.bulkConfigureMaoTopography(fireTrialId, body);
  }

  // ── Shot Topography ────────────────────────────────────────────────────────
  readonly shotTopographyResource = this.#shotTopography.shotTopographyResource;
  readonly shotShotTopographyResource = this.shotTopographyResource;

  getShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotTopography.getShotTopography(fireTrialId, seriesId, shotId);
  }

  fetchShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotTopographyResponse> {
    return this.#shotTopography.fetchShotTopography(fireTrialId, seriesId, shotId);
  }

  readonly updateShotTopographyResource = this.#shotTopography.updateShotTopographyResource;

  setShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotTopographyRequest): void {
    this.#shotTopography.setShotTopography(fireTrialId, seriesId, shotId, body);
  }

  updateShotTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTopographyRequest,
  ): Promise<ShotTopographyResponse> {
    return this.#shotTopography.updateShotTopography(fireTrialId, seriesId, shotId, body);
  }

  // ── Shot Trajectography ────────────────────────────────────────────────────
  readonly shotTrajectographyResource = this.#shotTrajectography.shotTrajectographyResource;
  readonly shotShotTrajectographyResource = this.shotTrajectographyResource;

  getShotTrajectography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotTrajectography.getShotTrajectography(fireTrialId, seriesId, shotId);
  }

  fetchShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotTrajectographyResponse> {
    return this.#shotTrajectography.fetchShotTrajectography(fireTrialId, seriesId, shotId);
  }

  readonly updateShotTrajectographyResource = this.#shotTrajectography.updateShotTrajectographyResource;

  setShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): void {
    this.#shotTrajectography.setShotTrajectography(fireTrialId, seriesId, shotId, body);
  }

  updateShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): Promise<ShotTrajectographyResponse> {
    return this.#shotTrajectography.updateShotTrajectography(fireTrialId, seriesId, shotId, body);
  }

  // ── Shot Acoustic Level ────────────────────────────────────────────────────
  readonly shotAcousticLevelResource = this.#shotAcousticLevel.shotAcousticLevelResource;
  readonly shotShotAcousticLevelResource = this.shotAcousticLevelResource;

  getShotAcousticLevel(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotAcousticLevel.getShotAcousticLevel(fireTrialId, seriesId, shotId);
  }

  fetchShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotAcousticLevelResponse> {
    return this.#shotAcousticLevel.fetchShotAcousticLevel(fireTrialId, seriesId, shotId);
  }

  readonly updateShotAcousticLevelResource = this.#shotAcousticLevel.updateShotAcousticLevelResource;

  setShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): void {
    this.#shotAcousticLevel.setShotAcousticLevel(fireTrialId, seriesId, shotId, body);
  }

  updateShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): Promise<ShotAcousticLevelResponse> {
    return this.#shotAcousticLevel.updateShotAcousticLevel(fireTrialId, seriesId, shotId, body);
  }

  // ── Shot Video Data ────────────────────────────────────────────────────────
  readonly shotVideoDataResource = this.#shotVideo.shotVideoDataResource;

  getShotVideoData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotVideo.getShotVideoData(fireTrialId, seriesId, shotId);
  }

  fetchShotVideoData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotVideoDataResponse> {
    return this.#shotVideo.fetchShotVideoData(fireTrialId, seriesId, shotId);
  }

  readonly updateShotVideoDataResource = this.#shotVideo.updateShotVideoDataResource;

  setShotVideoData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotVideoDataRequest): void {
    this.#shotVideo.setShotVideoData(fireTrialId, seriesId, shotId, body);
  }

  updateShotVideoData(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotVideoDataRequest,
  ): Promise<ShotVideoDataResponse> {
    return this.#shotVideo.updateShotVideoData(fireTrialId, seriesId, shotId, body);
  }

  // ── JLT Shot Data ──────────────────────────────────────────────────────────
  readonly jltShotDataResource = this.#shotJltData.jltShotDataResource;

  getJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotJltData.getJltShotData(fireTrialId, seriesId, shotId);
  }

  fetchJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<JltShotDataResponse> {
    return this.#shotJltData.fetchJltShotData(fireTrialId, seriesId, shotId);
  }

  readonly updateJltShotDataResource = this.#shotJltData.updateJltShotDataResource;

  setJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: JltShotDataRequest): void {
    this.#shotJltData.setJltShotData(fireTrialId, seriesId, shotId, body);
  }

  updateJltShotData(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: JltShotDataRequest,
  ): Promise<JltShotDataResponse> {
    return this.#shotJltData.updateJltShotData(fireTrialId, seriesId, shotId, body);
  }

  // ── Shot Velocities ────────────────────────────────────────────────────────
  readonly shotVelocitiesResource = this.#shotVelocities.shotVelocitiesResource;

  getShotVelocities(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotVelocities.getShotVelocities(fireTrialId, seriesId, shotId);
  }

  fetchShotVelocities(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotVelocitiesResponse> {
    return this.#shotVelocities.fetchShotVelocities(fireTrialId, seriesId, shotId);
  }

  readonly updateShotVelocitiesResource = this.#shotVelocities.updateShotVelocitiesResource;

  setShotVelocity(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotVelocitiesRequest): void {
    this.#shotVelocities.setShotVelocity(fireTrialId, seriesId, shotId, body);
  }

  updateShotVelocity(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotVelocitiesRequest,
  ): Promise<ShotVelocitiesResponse> {
    return this.#shotVelocities.updateShotVelocity(fireTrialId, seriesId, shotId, body);
  }

  // ── Shot Manometer Pressures ───────────────────────────────────────────────
  readonly shotManometerPressuresResource = this.#shotManometerPressures.shotManometerPressuresResource;

  getShotManometerPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotManometerPressures.getShotManometerPressures(fireTrialId, seriesId, shotId);
  }

  fetchShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotManometerPressuresResponse> {
    return this.#shotManometerPressures.fetchShotManometerPressures(fireTrialId, seriesId, shotId);
  }

  readonly updateShotManometerPressuresResource = this.#shotManometerPressures.updateShotManometerPressuresResource;

  setShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): void {
    this.#shotManometerPressures.setShotManometerPressures(fireTrialId, seriesId, shotId, body);
  }

  updateShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): Promise<ShotManometerPressuresResponse> {
    return this.#shotManometerPressures.updateShotManometerPressures(fireTrialId, seriesId, shotId, body);
  }

  // ── Shot IPG Pressures ─────────────────────────────────────────────────────
  readonly shotIpgPressuresResource = this.#shotIpgPressures.shotIpgPressuresResource;

  getShotIpgPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#shotIpgPressures.getShotIpgPressures(fireTrialId, seriesId, shotId);
  }

  fetchShotIpgPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotIpgPressuresResponse> {
    return this.#shotIpgPressures.fetchShotIpgPressures(fireTrialId, seriesId, shotId);
  }

  readonly updateShotIpgPressuresResource = this.#shotIpgPressures.updateShotIpgPressuresResource;

  setShotIpgPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotIpgPressuresRequest,
  ): void {
    this.#shotIpgPressures.setShotIpgPressures(fireTrialId, seriesId, shotId, body);
  }

  updateShotIpgPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotIpgPressuresRequest,
  ): Promise<ShotIpgPressuresResponse> {
    return this.#shotIpgPressures.updateShotIpgPressures(fireTrialId, seriesId, shotId, body);
  }

  // ── Trial Overpressure Info ────────────────────────────────────────────────
  readonly trialOverpressureInfoResource = this.#overpressure.trialOverpressureInfoResource;

  getTrialOverpressureInfo(fireTrialId: FireTrial['id']): void {
    this.#overpressure.getTrialOverpressureInfo(fireTrialId);
  }

  fetchTrialOverpressureInfo(fireTrialId: FireTrial['id']): Promise<TrialOverpressureInfoResponse> {
    return this.#overpressure.fetchTrialOverpressureInfo(fireTrialId);
  }

  updateTrialOverpressureInfo(
    fireTrialId: FireTrial['id'],
    body: TrialOverpressureInfoRequest,
  ): Promise<TrialOverpressureInfoResponse> {
    return this.#overpressure.updateTrialOverpressureInfo(fireTrialId, body);
  }
}
