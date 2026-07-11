import { signalStore } from '@ngrx/signals';

import { withAnalysisWidgets } from './features/analysis-widgets.feature';
import { withDataIntroductionWidgets } from './features/data-introduction-widgets.feature';
import { withEquipmentSelector } from './features/equipment-selector.feature';
import { withFieldDataWidgets } from './features/field-data-widgets.feature';
import { withGeneralData } from './features/general-data.feature';
import { withOrientationWidgets } from './features/orientation-widgets.feature';
import { withReadiness } from './features/readiness.feature';

export * from './execution-state.models';

/**
 * Store central del dominio de Ejecución.
 *
 * El estado está descompuesto en features de SignalStore (una por widget o
 * grupo funcional) bajo `./features`. Todas las features se componen aquí en
 * una única instancia, por lo que la API pública y la sincronización entre
 * widgets se mantienen intactas.
 */
export const ExecutionStore = signalStore(
  withGeneralData(),
  withReadiness(),
  withEquipmentSelector(),
  withOrientationWidgets(),
  withDataIntroductionWidgets(),
  withFieldDataWidgets(),
  withAnalysisWidgets(),
);

export type ExecutionStoreType = InstanceType<typeof ExecutionStore>;
