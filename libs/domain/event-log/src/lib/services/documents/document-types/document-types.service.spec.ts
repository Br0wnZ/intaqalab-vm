import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
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
      providers: [provideTestingEnvironment(), provideTranslateService({ loader: provideTranslateLoader(FakeTranslateLoader) })],
    });
    service = TestBed.inject(DocumentTypesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
