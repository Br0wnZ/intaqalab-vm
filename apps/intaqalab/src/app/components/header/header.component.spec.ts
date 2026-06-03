import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FeatureFlagService, provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { IntaIconComponent } from '@intaqalab/ui';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { HeaderComponent } from './header.component';

// Stub with correct selector to replace HeaderToolsComponent (lib-header-tools)
// eslint-disable-next-line @angular-eslint/component-selector
@Component({ selector: 'lib-header-tools', template: '', standalone: true })
class HeaderToolsStub {}

type MockUser = { name: string };

function makeMockAuthService(user: MockUser | null = { name: 'Test User' }) {
  return { user: signal<MockUser | null>(user) };
}

function makeMockFeatureFlagService(tabsEnabled = true) {
  return {
    tabsNavigation: signal(tabsEnabled),
    toggleTabsNavigation: vi.fn(),
  };
}

type MockFeatureFlagService = ReturnType<typeof makeMockFeatureFlagService>;

interface SetupOptions {
  user?: MockUser | null;
  tabsEnabled?: boolean;
}

async function setup({ user = { name: 'Test User' }, tabsEnabled = true }: SetupOptions = {}) {
  const mockAuthService = makeMockAuthService(user);
  const mockFeatureFlagService = makeMockFeatureFlagService(tabsEnabled);
  const events = userEvent.setup();
  const logoutSpy = vi.fn();

  const view = await render(HeaderComponent, {
    componentImports: [MatIconModule, MatButtonModule, IntaIconComponent, HeaderToolsStub],
    on: { logout: logoutSpy },
    providers: [
      provideTestingEnvironment(),
      { provide: FeatureFlagService, useValue: mockFeatureFlagService },
      { provide: AuthService, useValue: mockAuthService },
    ],
  });

  view.fixture.detectChanges();
  const container = view.fixture.nativeElement as HTMLElement;
  return { view, mockAuthService, mockFeatureFlagService, events, container, logoutSpy };
}

describe('HeaderComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should display the user name in the heading', async () => {
      await setup({ user: { name: 'Jane Doe' } });
      expect(screen.getByText('Jane Doe')).toBeTruthy();
    });

    it('should display an empty heading when user is null', async () => {
      await setup({ user: null });
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent?.trim()).toBe('');
    });
  });

  describe('tabs navigation', () => {
    it('should show "ON" when tabs navigation is enabled', async () => {
      await setup({ tabsEnabled: true });
      expect(screen.getByText(/Tabs: ON/)).toBeTruthy();
    });

    it('should show "OFF" when tabs navigation is disabled', async () => {
      await setup({ tabsEnabled: false });
      expect(screen.getByText(/Tabs: OFF/)).toBeTruthy();
    });

    it('should call featureFlags.toggleTabsNavigation when toggle button is clicked', async () => {
      const { events, container, mockFeatureFlagService } = await setup({ tabsEnabled: true });

      // Toggle button is the first .inta-icon-btn in the template (inside devMode section)
      const toggleButton = container.querySelector('button.inta-icon-btn') as HTMLButtonElement;
      await events.click(toggleButton);

      expect(mockFeatureFlagService.toggleTabsNavigation).toHaveBeenCalledOnce();
    });
  });

  describe('logout', () => {
    it('should emit logout when logout button is clicked', async () => {
      const { events, container, logoutSpy } = await setup();

      // Logout button is the last .inta-icon-btn in the template
      const buttons = container.querySelectorAll('button.inta-icon-btn');
      const logoutButton = buttons[buttons.length - 1] as HTMLButtonElement;
      await events.click(logoutButton);

      expect(logoutSpy).toHaveBeenCalledOnce();
    });
  });
});
