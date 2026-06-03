import { signal } from '@angular/core';
import type { Role } from '@intaqalab/core';
import { AuthService } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

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

describe('ButtonActionsComponent', () => {
  it('should fill the form', async () => {
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
      ],
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });
});
