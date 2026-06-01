import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { injectionTokenTabCommand, provideTestingEnvironment } from '@intaqalab/core';
import { CalendarEventsDataService, LinesOfShotDataService } from '@intaqalab/data-access';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { FeatureCalendarTrialsShellComponent } from './feature-calendar-trials-shell.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

class ToasterStub {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  showSuccess(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  showError(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  showInfo(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  showWarning(): void {}
}

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

describe('FeatureCalendarTrialsShellComponent', () => {
  it('should render', async () => {
    await render(FeatureCalendarTrialsShellComponent, {
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        {
          provide: LinesOfShotDataService,
          useValue: {
            list: () => {
              return of([
                {
                  id: 1,
                  name: 'Línea 1',
                },
                {
                  id: 2,
                  name: 'Línea 2',
                },
                {
                  id: 3,
                  name: 'Todas las líneas',
                },
              ]);
            },
          },
        },
        {
          provide: CalendarEventsDataService,
          useClass: MockCalendarEventsDataService,
        },
        { provide: ToastrService, useValue: ToasterStub },
      ],
      componentProviders: [
        {
          provide: injectionTokenTabCommand,
          useValue: null,
        },
      ],
    });

    // const store = fixture.componentInstance.store;
  });
});

class MockCalendarEventsDataService {
  getMonthEvents() {
    const result = {
      holidays: [
        {
          id: 1,
          title: 'Día del pilar',
          date: '2025-10-12T00:00:00.000Z',
          eventType: 'HOLIDAY',
        },
      ],
      no_notams: [
        {
          id: 2,
          title: 'No Notams',
          date: '2025-10-15T00:00:00.000Z',
          eventType: 'NO_NOTAM',
        },
      ],
      trials: [
        {
          id: 3,
          title: 'Evento 2',
          date: '2025-10-29',
          eventType: 'TRIAL',
          description: 'Event of day bla bala bla',
          observations: 'Some observations to bla bla bla',
        },
        {
          id: 4,
          title: 'Evento De tiro',
          date: '2025-10-29',
          eventType: 'TRIAL',
          description: 'Event of day bla bala bla',
          observations: 'Some observations to bla bla bla',
        },
      ],
    };
    return of(result);
  }
}
