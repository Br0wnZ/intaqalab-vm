import { signalStoreFeature } from '@ngrx/signals';

import { withGrubbsCriterion } from './grubbs-criterion.feature';
import { withInformacionTarado } from './informacion-tarado.feature';
import { withOverpressure } from './overpressure.feature';
import { withSeguimiento } from './seguimiento.feature';
import { withStanagCriterios } from './stanag-criterios.feature';
import { withTaradoCharts } from './tarado-charts.feature';
import { withUniformidadChart } from './uniformidad-chart.feature';
import { withVigilancia } from './vigilancia.feature';

export function withAnalysisWidgets() {
  return signalStoreFeature(
    withSeguimiento(),
    withInformacionTarado(),
    withTaradoCharts(),
    withUniformidadChart(),
    withOverpressure(),
    withGrubbsCriterion(),
    withStanagCriterios(),
    withVigilancia(),
  );
}
