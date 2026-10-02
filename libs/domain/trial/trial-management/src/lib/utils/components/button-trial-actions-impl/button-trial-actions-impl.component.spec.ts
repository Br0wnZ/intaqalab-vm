import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FeatureFlagService } from '@intaqalab/config';
import type { Role } from '@intaqalab/core';
import { AuthService } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { ButtonTrialActionsComponent } from '../button-trial-actions/button-trial-actions.component';
import { ButtonTrialActionsImplComponent } from './button-trial-actions-impl.component';

// vi.mock hoisted by Vitest
class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

const AuthServiceMock = {
  userRoles: signal<Role[]>([]),
};

const FeatureFlagServiceMock = {
  executionEnabled: signal(true),
};

describe('ButtonTrialActionsImplComponent', () => {
  it('should render the actions button', async () => {
    await render(ButtonTrialActionsImplComponent, {
      inputs: {
        trial: {
          status: TrialStatus.EXECUTED,
        },
      },
      providers: [
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
        {
          provide: FeatureFlagService,
          useValue: FeatureFlagServiceMock,
        },
      ],
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });

  it('should not include EXECUTION action when trial status is CLOSED', async () => {
    const { fixture } = await render(ButtonTrialActionsImplComponent, {
      inputs: {
        trial: {
          status: TrialStatus.CLOSED,
        },
      },
      providers: [
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
        {
          provide: FeatureFlagService,
          useValue: FeatureFlagServiceMock,
        },
      ],
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });

    const childDebugEl = fixture.debugElement.query(By.directive(ButtonTrialActionsComponent));
    const childComponent = childDebugEl.componentInstance as ButtonTrialActionsComponent;
    const actions = childComponent.list().map((item) => item.option);
    expect(actions).not.toContain('EXECUTION');
  });

  it('should include EXECUTION action when trial status is EXECUTED', async () => {
    const { fixture } = await render(ButtonTrialActionsImplComponent, {
      inputs: {
        trial: {
          status: TrialStatus.EXECUTED,
        },
      },
      providers: [
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
        {
          provide: FeatureFlagService,
          useValue: FeatureFlagServiceMock,
        },
      ],
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });

    const childDebugEl = fixture.debugElement.query(By.directive(ButtonTrialActionsComponent));
    const childComponent = childDebugEl.componentInstance as ButtonTrialActionsComponent;
    const actions = childComponent.list().map((item) => item.option);
    expect(actions).toContain('EXECUTION');
  });

  it('should hide EXECUTION action when the feature is disabled', async () => {
    FeatureFlagServiceMock.executionEnabled.set(false);
    const { fixture } = await render(ButtonTrialActionsImplComponent, {
      inputs: {
        trial: {
          status: TrialStatus.EXECUTED,
        },
      },
      providers: [
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
        {
          provide: FeatureFlagService,
          useValue: FeatureFlagServiceMock,
        },
      ],
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });

    const childDebugEl = fixture.debugElement.query(By.directive(ButtonTrialActionsComponent));
    const childComponent = childDebugEl.componentInstance as ButtonTrialActionsComponent;
    const actions = childComponent.list().map((item) => item.option);
    expect(actions).not.toContain('EXECUTION');
    FeatureFlagServiceMock.executionEnabled.set(true);
  });
});
