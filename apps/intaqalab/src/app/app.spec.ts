import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { of, throwError } from 'rxjs';

import { App } from './app';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

function makeMockOidcService(isAuthenticated: boolean, roles?: string[]) {
  return {
    checkAuth: vi.fn(() => of({ isAuthenticated, userData: null })),
    authorize: vi.fn(),
    logoff: vi.fn(() => of(null)),
    logoffAndRevokeTokens: vi.fn(() => of(null)),
    getPayloadFromAccessToken: vi.fn(() => of({ realm_access: { roles: roles ?? [] } })),
    userData$: of(null),
  };
}

function makeMockAuthService() {
  return {
    setRawRoles: vi.fn(),
    setUserData: vi.fn(),
    hasAnyRole: vi.fn(),
    user: vi.fn(),
    userRoles: vi.fn().mockReturnValue([]),
  };
}

async function setup(isAuthenticated: boolean, roles?: string[]) {
  const mockOidcSecurityService = makeMockOidcService(isAuthenticated, roles);
  const mockAuthService = makeMockAuthService();

  const view = await render(App, {
    imports: [
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
    providers: [
      provideTestingEnvironment(),
      { provide: OidcSecurityService, useValue: mockOidcSecurityService },
      { provide: AuthService, useValue: mockAuthService },
    ],
  });

  view.fixture.detectChanges();
  return {
    fixture: view.fixture,
    componentInstance: view.fixture.componentInstance,
    mockOidcSecurityService,
    mockAuthService,
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should display the header', async () => {
      await setup(true);
      expect(screen.getByTestId('header')).toBeTruthy();
    });
  });

  describe('authentication', () => {
    it('should call authorize when user is not authenticated', async () => {
      const { mockOidcSecurityService } = await setup(false);
      expect(mockOidcSecurityService.authorize).toHaveBeenCalled();
    });

    it('should not call authorize when user is authenticated', async () => {
      const { mockOidcSecurityService } = await setup(true);
      expect(mockOidcSecurityService.authorize).not.toHaveBeenCalled();
    });

    it('should call authService.setUserData on each authentication check', async () => {
      const { mockAuthService } = await setup(true);
      expect(mockAuthService.setUserData).toHaveBeenCalledWith(null);
    });

    it('should call authService.setRawRoles with realm_access.roles when authenticated', async () => {
      const userRoles = ['rolA', 'rolB'];
      const { mockAuthService } = await setup(true, userRoles);
      expect(mockAuthService.setRawRoles).toHaveBeenCalledWith(userRoles);
    });

    it('should call authorize when checkAuth throws an error', async () => {
      const mockOidcSecurityService = {
        checkAuth: vi.fn(() => throwError(() => new Error('oidc error'))),
        authorize: vi.fn(),
        logoff: vi.fn(() => of(null)),
        logoffAndRevokeTokens: vi.fn(() => of(null)),
        getPayloadFromAccessToken: vi.fn(() => of(null)),
        userData$: of(null),
      };

      await render(App, {
        imports: [
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
          }),
        ],
        providers: [
          provideTestingEnvironment(),
          { provide: OidcSecurityService, useValue: mockOidcSecurityService },
          { provide: AuthService, useValue: makeMockAuthService() },
        ],
      });

      expect(mockOidcSecurityService.authorize).toHaveBeenCalled();
    });
  });
});
