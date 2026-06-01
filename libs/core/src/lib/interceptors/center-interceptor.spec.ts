import type { HttpInterceptorFn } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { centerInterceptor } from './center-interceptor';

describe('centerInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => centerInterceptor('http://localhost:3000')(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTestingEnvironment()] });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
