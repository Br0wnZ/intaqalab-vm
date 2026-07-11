import { signalStoreFeature } from '@ngrx/signals';

import { withAcousticLevelIntroduction } from './acoustic-level-introduction.feature';
import { withDatosBlancoBola } from './datos-blanco-bola.feature';
import { withPassCoords } from './pass-coords.feature';
import { withRadarMetcmq } from './radar-metcmq.feature';
import { withSeguridad } from './seguridad.feature';
import { withTargetData } from './target-data.feature';
import { withTopographyIntroduction } from './topography-introduction.feature';

export function withFieldDataWidgets() {
  return signalStoreFeature(
    withTopographyIntroduction(),
    withAcousticLevelIntroduction(),
    withTargetData(),
    withDatosBlancoBola(),
    withSeguridad(),
    withRadarMetcmq(),
    withPassCoords(),
  );
}
