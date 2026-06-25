/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, vi } from 'vitest';

import { createMockResource } from './core';

export type MockDialogResult = {
  close: ReturnType<typeof vi.fn>;
  afterClosed: ReturnType<typeof vi.fn>;
  backdropClick: ReturnType<typeof vi.fn>;
  keydownEvents: ReturnType<typeof vi.fn>;
};

export type TypedDialogData<T> = T & {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  iconColor?: string;
};

// ============================================================================
// FUNCIONES BASE PARA MOCKS
// ============================================================================

/**
 * Crea un mock de MatDialogRef
 */
export function createMockMatDialogRef(): MockDialogResult {
  return {
    close: vi.fn(),
    afterClosed: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
    }),
    backdropClick: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
    }),
    keydownEvents: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
    }),
  } as unknown as MockDialogResult;
}

/**
 * Crea un mock de MatDialog con configuración flexible
 */
export function createMockMatDialog(config?: { defaultResult?: any; mockImplementation?: ReturnType<typeof vi.fn> }) {
  const defaultResult = config?.defaultResult ?? null;
  const mockFn = config?.mockImplementation ?? vi.fn();

  const dialogMock = {
    open: mockFn.mockImplementation(() => ({
      afterClosed: vi.fn(() => ({
        subscribe: vi.fn((callback: (result: any) => void) => {
          callback(defaultResult);
          return { unsubscribe: vi.fn() };
        }),
      })),
    })),
  };

  return dialogMock;
}

/**
 * Espera a que un elemento aparezca en el DOM
 */
export async function waitForElement(findFn: () => HTMLElement | null, timeout = 3000): Promise<HTMLElement> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const element = findFn();
      if (element) {
        clearInterval(checkInterval);
        resolve(element);
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for element'));
      }
    }, 50);
  });
}

/**
 * Factory para crear especímenes de prueba
 */
export function createSpecimens(count = 3) {
  const fallbackEs = 'Especimen de prueba';
  const fallbackEn = 'Test specimen';
  const baseNames = [
    { es: 'Munición inerte 105mm', en: '105mm inert munition' },
    { es: 'Proyectil de entrenamiento', en: 'Training projectile' },
    { es: 'Tubo de cañón 120mm', en: '120mm cannon tube' },
    { es: 'Arma de prueba', en: 'Test weapon' },
    { es: 'Carga de ensayo', en: 'Test charge' },
  ];

  const items = Array.from({ length: count }, (_, i) => {
    const name = baseNames[i] ?? { es: `${fallbackEs} ${i + 1}`, en: `${fallbackEn} ${i + 1}` };

    return {
      id: `specimen-${i + 1}`,
      name,
      label: name.es,
      type: 'denomination',
      active: true,
    };
  });

  return {
    page: 1,
    pageSize: 100,
    totalElements: items.length,
    items,
  };
}

/**
 * Factory para crear usuarios de prueba
 */
export function createUsers(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    fullname: ['Juan Pérez', 'María García', 'Carlos López'][i] || `Usuario ${i + 1}`,
  }));
}

/**
 * Factory para crear series de prueba
 */
export function createSeries(count = 3, shotsPerSerie = 2) {
  return Array.from({ length: count }, (_, seriesIndex) => ({
    id: `${seriesIndex + 1}`,
    name: `Serie ${String.fromCharCode(65 + seriesIndex)}`,
    executionOrder: seriesIndex + 1,
    observations: `Observaciones de la serie ${String.fromCharCode(65 + seriesIndex)}`,
    shots: Array.from({ length: shotsPerSerie }, (_, shotIndex) => ({
      id: `${seriesIndex * shotsPerSerie + shotIndex + 1}`,
      globalNumber: seriesIndex * shotsPerSerie + shotIndex + 1,
      observation: '',
    })),
  }));
}

/**
 * Factory para crear condiciones de disparo de prueba para ShootingConditions
 */
export function createShootingConditions(count = 2, shotsPerSerie = 2) {
  return Array.from({ length: count }, (_, seriesIndex) => ({
    seriesId: `series-${seriesIndex + 1}`,
    seriesName: `Serie ${String.fromCharCode(65 + seriesIndex)}`,
    shots: Array.from({ length: shotsPerSerie }, (_, shotIndex) => ({
      shotId: `shot-${seriesIndex}-${shotIndex + 1}`,
      globalNumber: seriesIndex * shotsPerSerie + shotIndex + 1,
      date: '2025-06-01',
      targetTypeId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      targetMaterialId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      targetDimensionsId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      targetThicknessId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      distance: 100,
      distanceUnit: 'M',
      targetInclination: 0,
      targetInclinationUnit: 'DEGREES',
      orientation: 0,
      orientationUnit: 'DEGREES',
      elevation: 10,
      elevationUnit: 'DEGREES',
      angle: 45,
      angleUnit: 'DEGREES',
      range: 500,
      rangeUnit: 'M',
      impactZoneId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      functioningHeight: 50,
      functioningHeightUnit: 'M',
      nominalSpeed: 0,
      nominalSpeedUnit: 'M_S',
      powderWeight: 3.5,
      powderWeightUnit: 'KG',
      projectileWeight: 0,
      projectileWeightUnit: 'KG',
      observations: `Observación disparo ${shotIndex + 1}`,
    })),
  }));
}

/**
 * Factory para crear datos de planificación de prueba
 */
export function createTrialPlanningInfo(overrides = {}) {
  const base = {
    goal: 'Evaluar resistencia a sequía',
    specimen: [{ id: 'specimen-1', label: 'Trigo' }],
    planningUser: { id: 'user-1', fullname: 'Juan Pérez' },
    observations: 'Observaciones de prueba',
    requirements: 'Requisitos de prueba',
    additionalInfo: 'Info adicional',
    dateControl: {
      maxEmissionDates: 30,
      percentageTechnicalUnits: 40,
      percentageEndTrial: 50,
      daysSignReport: 10,
      reportDeadlineDate: '2025-12-31',
    },
  };

  return { ...base, ...overrides };
}

/**
 * Factory para crear datos de trial de prueba
 */
export function createTrial(overrides = {}) {
  const base = {
    code: 'TRIAL-2025-001',
    name: 'Prueba de trigo',
    description: 'Descripción de prueba',
    id: 'trial-123',
  };

  return { ...base, ...overrides };
}

/**
 * Factory para crear un mock de DataPlanningService
 */
export function createMockDataPlanningService(initialData?: {
  specimens?: {
    page: number;
    pageSize: number;
    totalElements: number;
    items: Array<{ id: string; name: { es: string; en: string }; label: string; type?: string; active?: boolean }>;
  };
  users?: Array<{ id: string; fullname: string }>;
  planningInfo?: any;
}) {
  const specimenResource = createMockResource(initialData?.specimens ?? createSpecimens());
  const usersResource = createMockResource(initialData?.users ?? createUsers());
  const getPlanningDataResource = createMockResource(initialData?.planningInfo);
  const updatePlanningDataResource = createMockResource();
  const createSpecimenResource = createMockResource();
  const updateSpecimenResource = createMockResource();
  const deleteSpecimenResource = createMockResource();

  return {
    specimenResource,
    usersResource,
    getPlanningDataResource,
    updatePlanningDataResource,
    createSpecimenResource,
    updateSpecimenResource,
    deleteSpecimenResource,
    getSpecimens: vi.fn(),
    getUsers: vi.fn(),
    getFireTrialPlanningInfo: vi.fn(),
    updateTrialPlanningInfoData: vi.fn(),
    createSpecimen: vi.fn(),
    updateSpecimen: vi.fn(),
    deleteSpecimen: vi.fn(),
    refreshSpecimens: vi.fn(),
    refreshUsers: vi.fn(),
  };
}

/**
 * Factory para crear un mock de SeriesAndShotsService
 */
export function createMockSeriesAndShotsService(initialData?: { series?: any[] }) {
  const seriesAndShotsResource = createMockResource(initialData?.series ?? createSeries());
  const addNewSerieResource = createMockResource();
  const updateSerieResource = createMockResource();
  const deleteSerieResource = createMockResource();
  const reorderSeriesResource = createMockResource();
  const addShotToSerieResource = createMockResource();
  const deleteShotFromSerieResource = createMockResource();

  return {
    seriesAndShotsResource,
    addNewSerieResource,
    updateSerieResource,
    deleteSerieResource,
    reorderSeriesResource,
    addShotToSerieResource,
    deleteShotFromSerieResource,
    getSeriesAndShots: vi.fn(),
    addNewSerie: vi.fn(),
    addShotToSerie: vi.fn(),
    reorderSeries: vi.fn(),
    deleteSerie: vi.fn(),
    updateSerie: vi.fn(),
    deleteShot: vi.fn(),
    updateShot: vi.fn(),
    resetAddNewSerie: vi.fn(),
    resetUpdateSerie: vi.fn(),
  };
}

/**
 * Factory para crear un mock de ShootingConditionsService
 */
export function createMockShootingConditionsService(initialData?: { conditions?: any[] }) {
  const conditionsResource = createMockResource(initialData?.conditions ?? createShootingConditions());
  const updateConditionsResource = createMockResource();
  const getTargetTypesResource = createMockResource([]);
  const getTargetMaterialsResource = createMockResource([]);
  const getTargetDimensionsResource = createMockResource([]);
  const getTargetThicknessesResource = createMockResource([]);
  const getImpactZonesResource = createMockResource([]);

  return {
    conditionsResource,
    updateConditionsResource,
    getTargetTypesResource,
    getTargetMaterialsResource,
    getTargetDimensionsResource,
    getTargetThicknessesResource,
    getImpactZonesResource,
    getShootingConditions: vi.fn(),
    updateShootingConditions: vi.fn(),
    getTargetTypes: vi.fn(),
    getTargetMaterials: vi.fn(),
    getTargetDimensions: vi.fn(),
    getTargetThicknesses: vi.fn(),
    getImpactZones: vi.fn(),
  };
}

/**
 * Factory para crear un mock de SeriesAndShotsStore
 */
export function createMockSeriesAndShotsStore(initialData?: { series?: any[]; fireTrialId?: string }) {
  const seriesResource = createMockResource(initialData?.series ?? createSeries());
  const addSerieResource = createMockResource();
  const updateSerieResource = createMockResource();
  const deleteSerieResource = createMockResource();
  const reorderSeriesResource = createMockResource();
  const addShotResource = createMockResource();
  const updateShotResource = createMockResource();
  const deleteShotResource = createMockResource();

  return {
    fireTrialId: vi.fn(() => initialData?.fireTrialId ?? null),

    // Series signals
    series: seriesResource.value,
    isLoadingSeries: seriesResource.isLoading,
    seriesError: seriesResource.error,

    // CRUD status
    addSerieStatus: addSerieResource.status,
    isAddingSerie: addSerieResource.isLoading,
    updateSerieStatus: updateSerieResource.status,
    isUpdatingSerie: updateSerieResource.isLoading,
    deleteSerieStatus: deleteSerieResource.status,
    isDeletingSerie: deleteSerieResource.isLoading,

    // Shot CRUD status
    addShotStatus: addShotResource.status,
    isAddingShot: addShotResource.isLoading,
    deleteShotStatus: deleteShotResource.status,
    isDeletingShot: deleteShotResource.isLoading,
    updateShotStatus: updateShotResource.status,
    isUpdatingShot: updateShotResource.isLoading,

    // Reorder status
    reorderSeriesStatus: reorderSeriesResource.status,

    // Methods
    loadSeries: vi.fn(),
    reloadSeries: vi.fn(),
    addSerie: vi.fn(),
    updateSerie: vi.fn(),
    deleteSerie: vi.fn(),
    reorderSeries: vi.fn(),
    resetAddSerie: vi.fn(),
    resetUpdateSerie: vi.fn(),
    addShotToSerie: vi.fn(),
    deleteShot: vi.fn(),
    updateShot: vi.fn(),

    // Internal resources
    _seriesResource: seriesResource,
    _addSerieResource: addSerieResource,
    _updateSerieResource: updateSerieResource,
    _deleteSerieResource: deleteSerieResource,
    _reorderSeriesResource: reorderSeriesResource,
    _addShotResource: addShotResource,
    _updateShotResource: updateShotResource,
    _deleteShotResource: deleteShotResource,
  };
}

/**
 * Factory para crear un mock de PlanningGeneralDataStore
 */
export function createMockPlanningGeneralDataStore(initialData?: {
  specimens?: {
    page: number;
    pageSize: number;
    totalElements: number;
    items: Array<{ id: string; name: { es: string; en: string }; label: string; type?: string }>;
  };
  users?: Array<{ id: string; fullname: string }>;
  planningInfo?: any;
  fireTrialId?: string;
  fireTrial?: any;
  shootingConditions?: any[];
  series?: Array<{ shotQuantity?: number; shots?: unknown[] }>;
  selectedSpecimens?: Array<{ specimenId: string; batch: string }>;
}) {
  const specimensResource = createMockResource(initialData?.specimens ?? createSpecimens());
  const usersResource = createMockResource(initialData?.users ?? createUsers());
  const planningInfoResource = createMockResource(initialData?.planningInfo);
  const updatePlanningInfoResource = createMockResource();
  const shootingConditionsResource = createMockResource(initialData?.shootingConditions ?? createShootingConditions());
  const updateConditionsResource = createMockResource();

  const createSpecimenResource = createMockResource();
  const updateSpecimenResource = createMockResource();
  const deleteSpecimenResource = createMockResource();

  return {
    // State
    fireTrialId: vi.fn(() => initialData?.fireTrialId ?? null),
    fireTrial: vi.fn(() => initialData?.fireTrial ?? null),
    fireTrialCode: vi.fn(() => initialData?.fireTrial?.code ?? null),

    // Planning Info signals
    planningInfo: planningInfoResource.value,
    hasPlanningInfo: vi.fn(() => initialData?.planningInfo !== undefined),
    isLoadingPlanningInfo: planningInfoResource.isLoading,
    planningInfoError: planningInfoResource.error,
    hasPlanningInfoError: vi.fn(() => planningInfoResource.error() !== undefined),

    // Series signals
    series: vi.fn(() => initialData?.series),
    hasSeries: vi.fn(() => (initialData?.series?.length ?? 0) > 0),
    hasSeriesWithShots: vi.fn(() =>
      (initialData?.series ?? []).some((serie) => (serie.shotQuantity ?? serie.shots?.length ?? 0) > 0),
    ),

    // Selected specimens state
    selectedSpecimens: vi.fn(() => initialData?.selectedSpecimens ?? []),

    // Specimens signals
    specimens: vi.fn(() => {
      const response = specimensResource.value();
      if (!response) return [];
      return response.items;
    }),
    typedSpecimens: vi.fn(() => {
      const response = specimensResource.value();
      if (!response) return [];
      return response.items;
    }),
    isLoadingSpecimens: specimensResource.isLoading,
    specimensError: specimensResource.error,
    isLoadingTypedSpecimens: specimensResource.isLoading,
    typedSpecimensError: specimensResource.error,
    createSpecimenStatus: createSpecimenResource.status,
    isCreatingSpecimen: createSpecimenResource.isLoading,
    createSpecimenError: createSpecimenResource.error,
    createdSpecimen: createSpecimenResource.value,
    updateSpecimenStatus: updateSpecimenResource.status,
    isUpdatingSpecimen: updateSpecimenResource.isLoading,
    updateSpecimenError: updateSpecimenResource.error,
    updatedSpecimen: updateSpecimenResource.value,
    deleteSpecimenStatus: deleteSpecimenResource.status,
    isDeletingSpecimen: deleteSpecimenResource.isLoading,
    deleteSpecimenError: deleteSpecimenResource.error,

    // Users signals
    users: usersResource.value,
    isLoadingUsers: usersResource.isLoading,
    usersError: usersResource.error,

    // Update status
    isUpdatingPlanningInfo: updatePlanningInfoResource.isLoading,
    updatePlanningInfoError: updatePlanningInfoResource.error,
    updatePlanningInfoStatus: updatePlanningInfoResource.status,

    // Combined status
    isLoading: vi.fn(() => false),

    // Shooting Conditions signals
    shootingConditions: shootingConditionsResource.value,
    conditionsUnits: vi.fn(() => null),
    isLoadingShootingConditions: shootingConditionsResource.isLoading,
    isUpdatingConditions: updateConditionsResource.isLoading,

    // Master data signals
    targetTypes: vi.fn(() => []),
    isLoadingTargetTypes: vi.fn(() => false),
    targetMaterials: vi.fn(() => []),
    isLoadingTargetMaterials: vi.fn(() => false),
    targetDimensions: vi.fn(() => []),
    isLoadingTargetDimensions: vi.fn(() => false),
    targetThicknesses: vi.fn(() => []),
    isLoadingTargetThicknesses: vi.fn(() => false),
    impactZones: vi.fn(() => []),
    isLoadingImpactZones: vi.fn(() => false),

    // Methods
    setFireTrialId: vi.fn(),
    setFireTrialData: vi.fn(),
    setSelectedSpecimens: vi.fn(),
    loadSpecimens: vi.fn(),
    loadSpecimensByType: vi.fn(),
    createSpecimen: vi.fn(),
    updateSpecimen: vi.fn(),
    deleteSpecimen: vi.fn(),
    loadUsers: vi.fn(),
    updatePlanningInfo: vi.fn(),
    reloadPlanningInfo: vi.fn(),
    reloadSpecimens: vi.fn(),
    reloadUsers: vi.fn(),

    // Shooting conditions methods
    getShootingConditions: vi.fn(),
    updateShootingConditions: vi.fn(),

    // Master data methods
    getTargetTypes: vi.fn(),
    getTargetMaterials: vi.fn(),
    getTargetDimensions: vi.fn(),
    getTargetThicknesses: vi.fn(),
    getImpactZones: vi.fn(),
    getSchedules: vi.fn(),

    // Reset
    reset: vi.fn(),

    // Internal resources for test manipulation

    _specimensResource: specimensResource,
    _createSpecimenResource: createSpecimenResource,
    _updateSpecimenResource: updateSpecimenResource,
    _deleteSpecimenResource: deleteSpecimenResource,
    _usersResource: usersResource,
    _planningInfoResource: planningInfoResource,
    _updatePlanningInfoResource: updatePlanningInfoResource,

    _shootingConditionsResource: shootingConditionsResource,
    _updateConditionsResource: updateConditionsResource,
  };
}

/**
 * Factory para crear un mock de TrialGeneralDataStore
 */
export function createMockTrialGeneralDataStore(initialData?: { trial?: any; trialId?: string }) {
  const trialResource = createMockResource(initialData?.trial ?? null);

  return {
    trialId: vi.fn(() => initialData?.trialId ?? null),
    trial: trialResource.value,
    isLoading: trialResource.isLoading,
    setTrialId: vi.fn(),
    _trialResource: trialResource,
  };
}

/**
 * Factory para crear un mock de TrialsDataService
 */
export function createMockTrialsDataService() {
  const createTrialResource = createMockResource();
  const updateTrialResource = createMockResource();
  const sourceResource = createMockResource([]);

  return {
    createTrialResource,
    updateTrialResource,
    source: sourceResource,
    createTrial: vi.fn(),
    updateTrial: vi.fn(),
    search: vi.fn(),
    _createTrialResource: createTrialResource,
    _updateTrialResource: updateTrialResource,
    _sourceResource: sourceResource,
  };
}

// ============================================================================
// UTILIDADES DE TESTING
// ============================================================================

/**
 * Configura el entorno de testing con mocks comunes
 */
export function setupTestEnvironment() {
  // Limpiar todos los mocks antes de cada test
  vi.clearAllMocks();

  return {
    afterEach: () => {
      vi.restoreAllMocks();
    },
  };
}

/**
 * Verifica que un mock haya sido llamado con los argumentos esperados
 */
export function verifyMockCall(mockFn: ReturnType<typeof vi.fn>, callIndex: number, expectedArgs: any[]) {
  const calls = mockFn.mock.calls;
  expect(calls.length).toBeGreaterThan(callIndex);
  expect(calls[callIndex]).toEqual(expectedArgs);
}

/**
 * Crea un spy para console.log que se limpia automáticamente
 */
export function createConsoleSpy() {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

  return {
    spy: consoleSpy,
    restore: () => consoleSpy.mockRestore(),
  };
}

/**
 * Factory para crear un mock de MunitionsService
 */
export function createMockMunitionsService(initialData?: {
  munitions?: { series: Array<{ seriesId: string; seriesName: string; configurations: any[] }> };
  componentTypes?: { page: number; pageSize: number; totalElements: number; items: any[] };
  denominations?: { page: number; pageSize: number; totalElements: number; items: any[] };
  fuseWorkingModes?: { page: number; pageSize: number; totalElements: number; items: any[] };
}) {
  // Trial Munitions resources
  const munitionsResource = createMockResource(initialData?.munitions);
  const updateMunitionsResource = createMockResource<void>();

  // Component Types resources
  const componentTypesResource = createMockResource(initialData?.componentTypes);
  const createComponentTypeResource = createMockResource();
  const updateComponentTypeResource = createMockResource();
  const deleteComponentTypeResource = createMockResource();

  // Denominations resources
  const denominationsResource = createMockResource(initialData?.denominations);
  const createDenominationResource = createMockResource();
  const updateDenominationResource = createMockResource();
  const deleteDenominationResource = createMockResource();

  // Fuse Working Modes resources
  const fuseWorkingModesResource = createMockResource(initialData?.fuseWorkingModes);
  const createFuseWorkingModeResource = createMockResource();
  const updateFuseWorkingModeResource = createMockResource();
  const deleteFuseWorkingModeResource = createMockResource();

  return {
    // Trial Munitions
    munitionsResource,
    updateMunitionsResource,
    getMunitions: vi.fn(),
    updateMunitions: vi.fn(),
    resetUpdateMunitions: vi.fn(),

    // Component Types
    componentTypesResource,
    createComponentTypeResource,
    updateComponentTypeResource,
    deleteComponentTypeResource,
    getComponentTypes: vi.fn(),
    createComponentType: vi.fn(),
    updateComponentType: vi.fn(),
    deleteComponentType: vi.fn(),
    resetCreateComponentType: vi.fn(),
    resetUpdateComponentType: vi.fn(),
    resetDeleteComponentType: vi.fn(),

    // Denominations
    denominationsResource,
    createDenominationResource,
    updateDenominationResource,
    deleteDenominationResource,
    getDenominations: vi.fn(),
    createDenomination: vi.fn(),
    updateDenomination: vi.fn(),
    deleteDenomination: vi.fn(),
    resetCreateDenomination: vi.fn(),
    resetUpdateDenomination: vi.fn(),
    resetDeleteDenomination: vi.fn(),

    // Fuse Working Modes
    fuseWorkingModesResource,
    createFuseWorkingModeResource,
    updateFuseWorkingModeResource,
    deleteFuseWorkingModeResource,
    getFuseWorkingModes: vi.fn(),
    createFuseWorkingMode: vi.fn(),
    updateFuseWorkingMode: vi.fn(),
    deleteFuseWorkingMode: vi.fn(),
    resetCreateFuseWorkingMode: vi.fn(),
    resetUpdateFuseWorkingMode: vi.fn(),
    resetDeleteFuseWorkingMode: vi.fn(),

    // Internal resources for test manipulation
    _munitionsResource: munitionsResource,
    _updateMunitionsResource: updateMunitionsResource,
    _componentTypesResource: componentTypesResource,
    _createComponentTypeResource: createComponentTypeResource,
    _updateComponentTypeResource: updateComponentTypeResource,
    _deleteComponentTypeResource: deleteComponentTypeResource,
    _denominationsResource: denominationsResource,
    _createDenominationResource: createDenominationResource,
    _updateDenominationResource: updateDenominationResource,
    _deleteDenominationResource: deleteDenominationResource,
    _fuseWorkingModesResource: fuseWorkingModesResource,
    _createFuseWorkingModeResource: createFuseWorkingModeResource,
    _updateFuseWorkingModeResource: updateFuseWorkingModeResource,
    _deleteFuseWorkingModeResource: deleteFuseWorkingModeResource,
  };
}

/**
 * Factory para crear datos de prueba de municiones
 */
export function createMunitionsTestData(overrides?: Partial<{ seriesCount: number; configsPerSeries: number }>) {
  const { seriesCount = 2, configsPerSeries = 2 } = overrides ?? {};

  return {
    series: Array.from({ length: seriesCount }, (_, seriesIdx) => ({
      seriesId: `series-${seriesIdx + 1}`,
      seriesName: `Serie ${String.fromCharCode(65 + seriesIdx)}`,
      configurations: Array.from({ length: configsPerSeries }, (_, configIdx) => ({
        id: `config-${seriesIdx + 1}-${configIdx + 1}`,
        seriesId: `series-${seriesIdx + 1}`,
        denomination: `Denominación ${configIdx + 1}`,
        batch: `Lote-${configIdx + 1}`,
        observations: `Observaciones ${configIdx + 1}`,
        maxAllowedErrors: 3,
        components: [],
        assignedShotIds: [`shot-${configIdx + 1}`],
      })),
    })),
  };
}

/**
 * Factory para crear datos de catálogos de municiones
 */
export function createMunitionsCatalogTestData() {
  return {
    componentTypes: {
      page: 0,
      pageSize: 100,
      totalElements: 2,
      items: [
        {
          id: 'ct-1',
          name: { es: 'Espoleta', en: 'Fuse' },
          label: 'Espoleta',
          observations: '',
          category: 'MUNITION_COMPONENT',
          active: true,
        },
        {
          id: 'ct-2',
          name: { es: 'Proyectil', en: 'Projectile' },
          label: 'Proyectil',
          observations: '',
          category: 'MUNITION_COMPONENT',
          active: true,
        },
      ],
    },
    denominations: {
      page: 0,
      pageSize: 100,
      totalElements: 2,
      items: [
        {
          id: 'denom-1',
          name: 'Denom 1',
          category: 'MUNITION',
          munitionType: { id: 'mt-1', name: 'MunType 1' },
          active: true,
        },
        {
          id: 'denom-2',
          name: 'Denom 2',
          category: 'MUNITION',
          munitionType: { id: 'mt-1', name: 'MunType 1' },
          active: true,
        },
      ],
    },
    fuseWorkingModes: {
      page: 0,
      pageSize: 10,
      totalElements: 2,
      items: [
        { id: 'fwm-1', name: 'Instantáneo', active: true },
        { id: 'fwm-2', name: 'Retardado', active: true },
      ],
    },
  };
}

// ============================================================================
// CONSTANTES DE TESTING
// ============================================================================

export const TEST_CONSTANTS = {
  TIMEOUT: {
    SHORT: 1000,
    MEDIUM: 3000,
    LONG: 5000,
  },
  IDS: {
    SPECIMEN: {
      MUNITION_INERT: 'specimen-1',
      TRAINING_PROJECTILE: 'specimen-2',
      CANNON_TUBE: 'specimen-3',
    },
    USER: {
      JUAN: 'user-1',
      MARIA: 'user-2',
      CARLOS: 'user-3',
    },
    TRIAL: {
      DEFAULT: 'TRIAL-2025-001',
      ALT: 'TRIAL-2025-002',
    },
  },
  DATES: {
    TODAY: new Date().toISOString().split('T')[0],
    TOMORROW: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    NEXT_WEEK: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    NEXT_MONTH: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  },
};

// ============================================================================
// ARMAMENT MOCKS
// ============================================================================

/**
 * Factory para crear un mock de ArmamentService
 */
export function createMockArmamentService(initialData?: {
  armament?: { series: Array<{ seriesId: string; seriesName: string; configurations: any[] }> };
  weapons?: { page: number; pageSize: number; totalElements: number; items: any[] };
  tubes?: { page: number; pageSize: number; totalElements: number; items: any[] };
}) {
  // Trial Armament resources
  const armamentResource = createMockResource(initialData?.armament);
  const updateArmamentResource = createMockResource<void>();

  // Weapons resources
  const weaponsResource = createMockResource(initialData?.weapons);

  // Tubes resources
  const tubesResource = createMockResource(initialData?.tubes);

  return {
    // Trial Armament
    armamentResource,
    updateArmamentResource,
    getArmament: vi.fn(),
    updateArmament: vi.fn(),
    resetUpdateArmament: vi.fn(),

    // Weapons
    weaponsResource,
    getWeapons: vi.fn(),

    // Tubes
    tubesResource,
    getTubes: vi.fn(),

    // Internal resources for test manipulation
    _armamentResource: armamentResource,
    _updateArmamentResource: updateArmamentResource,
    _weaponsResource: weaponsResource,
    _tubesResource: tubesResource,
  };
}

/**
 * Factory para crear datos de prueba de armamento
 */
export function createArmamentTestData(overrides?: Partial<{ seriesCount: number; configsPerSeries: number }>) {
  const { seriesCount = 2, configsPerSeries = 2 } = overrides ?? {};

  return {
    series: Array.from({ length: seriesCount }, (_, seriesIdx) => ({
      seriesId: `series-${seriesIdx + 1}`,
      seriesName: `Serie ${String.fromCharCode(65 + seriesIdx)}`,
      configurations: Array.from({ length: configsPerSeries }, (_, configIdx) => ({
        id: `config-${seriesIdx + 1}-${configIdx + 1}`,
        seriesId: `series-${seriesIdx + 1}`,
        weapon: `Arma ${configIdx + 1}`,
        tube: `Tubo ${configIdx + 1}`,
        observations: `Observaciones ${configIdx + 1}`,
        assignedShotIds: [`shot-${configIdx + 1}`],
      })),
    })),
  };
}

/**
 * Factory para crear datos de catálogos de armamento
 */
export function createArmamentCatalogTestData() {
  return {
    weapons: {
      page: 0,
      pageSize: 10,
      totalElements: 2,
      items: [
        { id: 'weapon-1', name: { es: 'Arma 1', en: 'Weapon 1' }, label: 'Arma 1', active: true },
        { id: 'weapon-2', name: { es: 'Arma 2', en: 'Weapon 2' }, label: 'Arma 2', active: true },
      ],
    },
    tubes: {
      page: 0,
      pageSize: 10,
      totalElements: 2,
      items: [
        { id: 'tube-1', name: { es: 'Tubo 1', en: 'Tube 1' }, label: 'Tubo 1', active: true },
        { id: 'tube-2', name: { es: 'Tubo 2', en: 'Tube 2' }, label: 'Tubo 2', active: true },
      ],
    },
  };
}

/**
 * Factory para crear un mock de MeasuresService
 */
export function createMockMeasuresService(initialData?: {
  measures?: { series: Array<{ seriesId: string; seriesName: string; measures: any[] }> };
  measuresCatalog?: { page: number; pageSize: number; totalElements: number; items: any[] };
}) {
  // Trial Measures resources
  const measuresResource = createMockResource(initialData?.measures);
  const updateMeasuresResource = createMockResource<void>();

  // Catalog resources
  const measuresCatalogResource = createMockResource(initialData?.measuresCatalog);
  const createMeasureResource = createMockResource();
  const updateMeasureResource = createMockResource();
  const deleteMeasureResource = createMockResource();
  const addFavoriteResource = createMockResource<void>();
  const removeFavoriteResource = createMockResource<void>();

  return {
    // Trial Measures
    measuresResource,
    updateMeasuresResource,
    getMeasures: vi.fn(),
    updateMeasures: vi.fn(),
    resetUpdateMeasures: vi.fn(),

    // Catalog
    measuresCatalogResource,
    createMeasureResource,
    updateMeasureResource,
    deleteMeasureResource,
    addFavoriteResource,
    removeFavoriteResource,
    getMeasuresCatalog: vi.fn(),
    createMeasure: vi.fn(),
    updateMeasure: vi.fn(),
    deleteMeasure: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    resetCreateMeasure: vi.fn(),
    resetUpdateMeasure: vi.fn(),
    resetDeleteMeasure: vi.fn(),
    resetAddFavorite: vi.fn(),
    resetRemoveFavorite: vi.fn(),

    // Internal resources for test manipulation
    _measuresResource: measuresResource,
    _updateMeasuresResource: updateMeasuresResource,
    _measuresCatalogResource: measuresCatalogResource,
    _createMeasureResource: createMeasureResource,
    _updateMeasureResource: updateMeasureResource,
    _deleteMeasureResource: deleteMeasureResource,
    _addFavoriteResource: addFavoriteResource,
    _removeFavoriteResource: removeFavoriteResource,
  };
}

/**
 * Factory para crear datos de prueba de medidas
 */
export function createMeasuresTestData(overrides?: Partial<{ seriesCount: number; measuresPerSeries: number }>) {
  const { seriesCount = 2, measuresPerSeries = 2 } = overrides ?? {};

  return {
    series: Array.from({ length: seriesCount }, (_, seriesIdx) => ({
      seriesId: `series-${seriesIdx + 1}`,
      seriesName: `Serie ${String.fromCharCode(65 + seriesIdx)}`,
      measures: Array.from({ length: measuresPerSeries }, (_, measureIdx) => ({
        id: `measure-${seriesIdx + 1}-${measureIdx + 1}`,
        seriesId: `series-${seriesIdx + 1}`,
        shotId: `shot-${measureIdx + 1}`,
        measureType: `Type ${measureIdx + 1}`,
        value: 10 + measureIdx,
        unit: 'mm',
      })),
    })),
  };
}

/**
 * Factory para crear datos de catálogo de medidas
 */
export function createMeasuresCatalogTestData() {
  return {
    page: 0,
    pageSize: 10,
    totalElements: 2,
    items: [
      { id: 'measure-1', name: { es: 'Presión', en: 'Pressure' }, label: 'Presión', active: true, unit: 'TOPOGRAPHY' },
      {
        id: 'measure-2',
        name: { es: 'Velocidad', en: 'Velocity' },
        label: 'Velocidad',
        active: true,
        unit: 'MUNITIONS',
      },
    ],
  };
}
