import { Component, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FeatureFlagService, provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { LanguageService, type SupportedLanguage } from '@intaqalab/data-access';
import { IntaIconComponent } from '@intaqalab/ui';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { HeaderComponent } from './header.component';

// Stub to isolate HeaderToolsComponent in unit tests
// eslint-disable-next-line @angular-eslint/component-selector
@Component({ selector: 'lib-header-tools', template: '' })
class HeaderToolsStub {}

interface MockUser {
  name: string;
}

function makeMockAuthService(user: MockUser | null = { name: 'Test User' }) {
  return { user: signal<MockUser | null>(user) };
}

function makeMockFeatureFlagService(tabsEnabled = true) {
  return {
    tabsNavigation: signal(tabsEnabled),
    toggleTabsNavigation: vi.fn(),
  };
}

function makeMockLanguageService(initialLang: SupportedLanguage = 'es') {
  return {
    currentLanguage: signal<SupportedLanguage>(initialLang),
    supportedLanguages: ['es', 'en'] as SupportedLanguage[],
    setLanguage: vi.fn(),
  };
}

interface SetupOptions {
  user?: MockUser | null;
  tabsEnabled?: boolean;
  language?: SupportedLanguage;
}

async function runSetup({
  user = { name: 'Test User' },
  tabsEnabled = true,
  language = 'es',
}: SetupOptions = {}) {
  const mockAuthService = makeMockAuthService(user);
  const mockFeatureFlagService = makeMockFeatureFlagService(tabsEnabled);
  const mockLanguageService = makeMockLanguageService(language);
  const events = userEvent.setup();
  const logoutSpy = vi.fn();

  const view = await render(HeaderComponent, {
    imports: [NoopAnimationsModule],
    componentImports: [MatIconModule, MatButtonModule, MatMenuModule, IntaIconComponent, HeaderToolsStub],
    providers: [
      provideTestingEnvironment(),
      { provide: FeatureFlagService, useValue: mockFeatureFlagService },
      { provide: AuthService, useValue: mockAuthService },
      { provide: LanguageService, useValue: mockLanguageService },
    ],
    on: { logout: logoutSpy },
  });

  const container = view.fixture.nativeElement as HTMLElement;
  const loader = TestbedHarnessEnvironment.loader(view.fixture);

  return {
    view,
    mockAuthService,
    mockFeatureFlagService,
    mockLanguageService,
    events,
    container,
    loader,
    logoutSpy,
  };
}

describe('HeaderComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('user display', () => {
    it('should display the user name in the heading when user exists', async () => {
      await runSetup({ user: { name: 'Jane Doe' } });
      expect(screen.getByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument();
    });

    it('should display an empty heading when user is null', async () => {
      await runSetup({ user: null });
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent?.trim()).toBe('');
    });
  });

  describe('logout action', () => {
    it('should emit logout when the logout button is clicked', async () => {
      const { events, logoutSpy } = await runSetup();

      const [logoutButton] = screen.getAllByRole('button');
      await events.click(logoutButton);

      expect(logoutSpy).toHaveBeenCalledOnce();
    });
  });

  describe('language selection', () => {
    it('should display current language flag and code on trigger button', async () => {
      await runSetup({ language: 'es' });

      expect(screen.getByText('🇪🇸')).toBeInTheDocument();
      expect(screen.getByText('es')).toBeInTheDocument();
    });

    it('should open language menu and list all supported languages', async () => {
      const { loader } = await runSetup({ language: 'es' });

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      const items = await menu.getItems();
      expect(items.length).toBe(2);
      expect(await items[0].getText()).toContain('Español');
      expect(await items[1].getText()).toContain('English');
    });

    it('should call languageService.setLanguage when a language item is clicked', async () => {
      const { loader, mockLanguageService } = await runSetup({ language: 'es' });

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();

      const items = await menu.getItems();
      await items[1].click();

      expect(mockLanguageService.setLanguage).toHaveBeenCalledWith('en');
    });
  });

  describe('helper methods', () => {
    it('should return correct flag for supported languages', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      expect(component.getFlag('es')).toBe('🇪🇸');
      expect(component.getFlag('en')).toBe('🇬🇧');
    });

    it('should return correct language name for supported languages', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      expect(component.getLanguageName('es')).toBe('Español');
      expect(component.getLanguageName('en')).toBe('English');
    });

    it('should return tabsNavigationEnabled from featureFlags', async () => {
      const { view } = await runSetup({ tabsEnabled: true });
      const component = view.fixture.componentInstance;

      expect(component.tabsNavigationEnabled).toBe(true);
    });

    it('should delegate toggleTabsNavigation to featureFlags', async () => {
      const { view, mockFeatureFlagService } = await runSetup();
      const component = view.fixture.componentInstance;

      component.toggleTabsNavigation();

      expect(mockFeatureFlagService.toggleTabsNavigation).toHaveBeenCalledOnce();
    });
  });
});

