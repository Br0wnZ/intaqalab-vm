import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
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
    imports: [
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    // componentProviders: [{ provide: MAT_DIALOG_DATA, useValue: valuesInput }],
  });
});
