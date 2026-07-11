import { signalStoreFeature } from '@ngrx/signals';

import { withJltMao } from './jlt-mao.feature';
import { withMaoTopography } from './mao-topography.feature';
import { withRadarTrayectographyOrientation } from './radar-trayectography-orientation.feature';
import { withVideoCameraOrientation } from './video-camera-orientation.feature';

export function withOrientationWidgets() {
  return signalStoreFeature(
    withMaoTopography(),
    withJltMao(),
    withVideoCameraOrientation(),
    withRadarTrayectographyOrientation(),
  );
}
