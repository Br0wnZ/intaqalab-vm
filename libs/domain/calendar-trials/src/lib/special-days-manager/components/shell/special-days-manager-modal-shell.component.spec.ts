import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { SpecialDaysManagerComponent } from './special-days-manager-modal-shell.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}
test('SpecialDaysManagerComponent', async () => {
  await render(SpecialDaysManagerComponent, {
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), provideTranslateService({ loader: provideTranslateLoader(FakeTranslateLoader) })],
    // componentProviders: [{ provide: MAT_DIALOG_DATA, useValue: valuesInput }],
  });
});
