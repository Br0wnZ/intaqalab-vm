import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CONFIG, provideTestingEnvironment } from '@intaqalab/config';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LinesOfShotDataService } from './lines-of-shot-data.service';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

describe('LinesOfShotDataService', () => {
  let service: LinesOfShotDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: CONFIG,
          useValue: { apiUrl: '' },
        },
        provideTestingEnvironment(),
      ],
    });
    service = TestBed.inject(LinesOfShotDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
