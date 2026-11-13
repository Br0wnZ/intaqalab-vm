import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { DialogInputComponent } from './dialog-input.component';

describe('DialogInputComponent', () => {
  class FakeTranslateLoader {
    getTranslation() {
      return of({ HELLO: 'Hola' });
    }
  }

  it('should render', async () => {
    await render(DialogInputComponent, {
      componentProviders: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ], providers: [provideTranslateService({ loader: provideTranslateLoader(FakeTranslateLoader) })]
    });
  });
});
