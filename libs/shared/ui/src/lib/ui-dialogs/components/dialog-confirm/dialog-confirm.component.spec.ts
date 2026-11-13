import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { DialogConfirmComponent } from './dialog-confirm.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

describe('DialogConfirmComponent', () => {
  it('should render', async () => {
    await render(DialogConfirmComponent, {
      componentProviders: [{ provide: MAT_DIALOG_DATA, useValue: {} }], providers: [provideTranslateService({ loader: provideTranslateLoader(FakeTranslateLoader) })]
    });
  });
});
