import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import type { TrialSchedulerModalShellInput } from '../../trial-schedule.service';
import { TrialSchedulerModalShellComponent } from './trial-scheduler-modal-shell.component';

// vi.mock hoisted by Vitest
class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

const valuesInput: TrialSchedulerModalShellInput = {
  trial: { id: '1', trialNumber: 'trial number' },
  defaultValues: [
    { date: '2025-11-22', lineOfShootId: '1' },
    { date: '2025-11-24', lineOfShootId: '1' },
    { date: '2025-11-14', lineOfShootId: '2' },
  ],
  linesOfShotViewState: {
    current: '1',
    list: [
      { id: '1', name: 'Linea1' },
      { id: '2', name: 'Linea2' },
    ],
  },
};
test('TrialSchedulerModalShellComponent', async () => {
  await render(TrialSchedulerModalShellComponent, {
    imports: [
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    componentProviders: [{ provide: MAT_DIALOG_DATA, useValue: valuesInput }],
  });
});
