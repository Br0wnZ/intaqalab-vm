import { signal } from '@angular/core';
import { AuthService, Role } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { ButtonTrialActionsComponent } from './button-trial-actions.component';
import type { ButtonTrialActionsInput } from './button-trial-actions.model';

// vi.mock hoisted by Vitest
class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

const AuthServiceMock = {
  userRoles: signal<Role[]>([]),
};

describe('ButtonActionsComponent', () => {
  const trialActionsConfig: ButtonTrialActionsInput = {
    label: 'SOY LABEL',
    trial: { status: TrialStatus.ANALYZING, foo: 'bar' },
    list: [
      {
        label: 'DEMO.ACTIONS_BUTTON.ACTION1',
        option: 'ACTION1',
        status: [TrialStatus.EXECUTED],
      },
      {
        label: 'DEMO.ACTIONS_BUTTON.ACTION2',
        roles: [Role.PLANNING_TECHNICIAN],
        option: 'ACTION2',
      },
      {
        label: 'DEMO.ACTIONS_BUTTON.ACTION3',
        option: 'ACTION3',
      },
    ],
  };
  it('should render actions based on status and roles', async () => {
    await render(ButtonTrialActionsComponent, {
      inputs: {
        config: trialActionsConfig,
      },
      providers: [
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
      ],
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });

  it('should filter actions correctly', async () => {
    const { fixture } = await render(ButtonTrialActionsComponent, {
      inputs: {
        config: trialActionsConfig,
      },
      providers: [
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
      ],
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });

    const component = fixture.componentInstance;

    const visibleActions = component.list();
    expect(visibleActions).toHaveLength(1);
    expect(visibleActions.map((a) => a.option)).toEqual(['ACTION3']);
  });
});
