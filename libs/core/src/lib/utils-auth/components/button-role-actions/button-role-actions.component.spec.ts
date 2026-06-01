import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { ButtonRoleActionsComponent } from './button-role-actions.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}
describe('ButtonActionsComponent', () => {
  it('should fill the form', async () => {
    await render(ButtonRoleActionsComponent, {
      inputs: {
        label: 'hello',
        options: [],
      },

      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });
});
