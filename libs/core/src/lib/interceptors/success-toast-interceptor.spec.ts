import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { successToastInterceptor } from './success-toast-interceptor';

class ToasterStub {
  /* eslint-disable @typescript-eslint/no-empty-function */
  success(): void {}
  /* eslint-disable @typescript-eslint/no-empty-function */
  showError(): void {}
  /* eslint-disable @typescript-eslint/no-empty-function */
  showInfo(): void {}
  /* eslint-disable @typescript-eslint/no-empty-function */
  showWarning(): void {}
}
class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}
describe('loaderInterceptor (Jest)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastr: ToastrService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [
        provideTestingEnvironment(),
        { provide: ToastrService, useClass: ToasterStub },
        provideHttpClient(withInterceptors([successToastInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastr = TestBed.inject(ToastrService);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should show and hide', () => {
    const showSpy = vi.spyOn(toastr, 'success');
    http.post('http://localhost:3000/api/data', {}).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/data');
    req.flush({ ok: true });
    expect(showSpy).toHaveBeenCalledTimes(1);
  });

  it('should not show and hide if is an external api call', () => {
    const showSpy = vi.spyOn(toastr, 'success');
    http.post('/api/data', {}).subscribe();
    const req = httpMock.expectOne('/api/data');
    req.flush({ ok: true });
    expect(showSpy).not.toHaveBeenCalled();
  });
});
