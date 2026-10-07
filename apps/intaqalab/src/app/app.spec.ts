import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import type { OidcClientNotification } from 'angular-auth-oidc-client';
import { EventTypes, OidcSecurityService, PublicEventsService } from 'angular-auth-oidc-client';
import { Subject, of, throwError } from 'rxjs';

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
    logoffLocal: vi.fn(),
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
    clear: vi.fn(),
  };
}

function makeMockPublicEventsService() {
  const events$ = new Subject<OidcClientNotification<unknown>>();
  return {
    events$,
    registerForEvents: vi.fn(() => events$.asObservable()),
  };
}

async function setup(
  isAuthenticated: boolean,
  roles?: string[],
  mockEventsService?: ReturnType<typeof makeMockPublicEventsService>,
) {
  const mockOidcSecurityService = makeMockOidcService(isAuthenticated, roles);
  const mockAuthService = makeMockAuthService();
  const mockPublicEventsService = mockEventsService ?? makeMockPublicEventsService();

  const view = await render(App, {
    imports: [
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
    providers: [
      provideTestingEnvironment(),
      { provide: OidcSecurityService, useValue: mockOidcSecurityService },
      { provide: PublicEventsService, useValue: mockPublicEventsService },
      { provide: AuthService, useValue: mockAuthService },
    ],
  });

  view.fixture.detectChanges();
  return {
    fixture: view.fixture,
    componentInstance: view.fixture.componentInstance,
    mockOidcSecurityService,
    mockAuthService,
    mockPublicEventsService,
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
      expect(screen.getByTestId('header')).toBeInTheDocument();
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

  describe('token expiration', () => {
    it('should log off and clear auth state when SilentRenewFailed event is received', async () => {
      const mockEvents = makeMockPublicEventsService();
      const { mockOidcSecurityService, mockAuthService, componentInstance } = await setup(true, undefined, mockEvents);

      expect(componentInstance.isAuthenticated()).toBe(true);

      mockEvents.events$.next({ type: EventTypes.SilentRenewFailed });

      expect(componentInstance.isAuthenticated()).toBe(false);
      expect(mockAuthService.clear).toHaveBeenCalled();
      expect(mockOidcSecurityService.logoff).toHaveBeenCalled();
    });

    it('should fallback to logoffLocal if logoff throws on SilentRenewFailed', async () => {
      const mockEvents = makeMockPublicEventsService();
      const { mockOidcSecurityService, mockAuthService } = await setup(true, undefined, mockEvents);
      mockOidcSecurityService.logoff.mockReturnValue(throwError(() => new Error('Network error')));

      mockEvents.events$.next({ type: EventTypes.SilentRenewFailed });

      expect(mockAuthService.clear).toHaveBeenCalled();
      expect(mockOidcSecurityService.logoff).toHaveBeenCalled();
      expect(mockOidcSecurityService.logoffLocal).toHaveBeenCalled();
    });

    it('should not log off when an unrelated event is received', async () => {
      const mockEvents = makeMockPublicEventsService();
      const { mockOidcSecurityService, mockAuthService, componentInstance } = await setup(true, undefined, mockEvents);

      mockEvents.events$.next({ type: EventTypes.ConfigLoaded });

      expect(componentInstance.isAuthenticated()).toBe(true);
      expect(mockAuthService.clear).not.toHaveBeenCalled();
      expect(mockOidcSecurityService.logoff).not.toHaveBeenCalled();
    });
  });
});
