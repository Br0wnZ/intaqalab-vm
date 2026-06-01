import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { DocumentTypesService } from './document-types.service';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}
describe('DocumentTypesService', () => {
  let service: DocumentTypesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [provideTestingEnvironment()],
    });
    service = TestBed.inject(DocumentTypesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
