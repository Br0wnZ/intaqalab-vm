import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { of } from 'rxjs';

import { CalendarTrialsHeaderComponent } from './calendar-trials-header.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({
      'CALENDAR_TRIALS.CONTROLS.TODAY': 'Hoy',
    });
  }
}

describe('CalendarTrialsHeaderComponent', () => {
  it('should emit viewDateChange with today when clicking on Today button', async () => {
    const viewDateChangeSpy = vi.fn();

    const { fixture } = await render(CalendarTrialsHeaderComponent, {
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
        CalendarModule.forRoot({
          provide: DateAdapter,
          useFactory: adapterFactory,
        }),
      ],
      componentInputs: {
        viewDate: new Date('2026-06-01T00:00:00Z'),
      },
      componentProperties: {
        viewDateChange: {
          emit: viewDateChangeSpy,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    });

    const translate = fixture.debugElement.injector.get(TranslateService);
    translate.use('es');
    await fixture.whenStable();
    fixture.detectChanges();

    const todayButton = screen.getByText('Hoy');
    expect(todayButton).toBeInTheDocument();

    await userEvent.click(todayButton);

    expect(viewDateChangeSpy).toHaveBeenCalled();
    const emittedDate = viewDateChangeSpy.mock.calls[0][0] as Date;
    const today = new Date();

    expect(emittedDate.getFullYear()).toBe(today.getFullYear());
    expect(emittedDate.getMonth()).toBe(today.getMonth());
    expect(emittedDate.getDate()).toBe(today.getDate());
  });
});
