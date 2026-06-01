import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { TrialSchedulerInlineComponent } from './trial-scheduler-inline.component';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

test('TrialSchedulerInlineComponent', async () => {
  await render(
    `<inta-trial-scheduler-inline [trialId]="'TRIAL-1'" [trialStatus]="'ACTIVE'"></inta-trial-scheduler-inline>`,
    {
      imports: [
        TrialSchedulerInlineComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
      componentProviders: [],
    },
  );
});
