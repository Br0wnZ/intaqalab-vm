import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { LegendTrialSchedulerComponent } from './legend-trial-scheduler.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

test('LegendTrialSchedulerComponent', async () => {
  await render(LegendTrialSchedulerComponent, { providers: [provideTranslateService({ loader: provideTranslateLoader(FakeTranslateLoader) })]
  });
});
