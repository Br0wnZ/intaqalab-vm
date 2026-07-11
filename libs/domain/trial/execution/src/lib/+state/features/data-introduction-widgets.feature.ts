import { signalStoreFeature } from '@ngrx/signals';

import { withArmamentIntroduction } from './armament-introduction.feature';
import { withJltShotData } from './jlt-shot-data.feature';
import { withManometerIntroduction } from './manometer-introduction.feature';
import { withMunitionIntroduction } from './munition-introduction.feature';
import { withPiezoPressureIntroduction } from './piezo-pressure-introduction.feature';
import { withTrayectografiaIntroduction } from './trayectografia-introduction.feature';
import { withVelocityIntroduction } from './velocity-introduction.feature';

export function withDataIntroductionWidgets() {
  return signalStoreFeature(
    withArmamentIntroduction(),
    withJltShotData(),
    withMunitionIntroduction(),
    withVelocityIntroduction(),
    withPiezoPressureIntroduction(),
    withManometerIntroduction(),
    withTrayectografiaIntroduction(),
  );
}
