import type { NavigationEnd } from '@angular/router';
import { Router } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService, Role } from '@intaqalab/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Subject } from 'rxjs';

import { CommandsTabService } from '../../services/tabs/commands-tab-service';
import { MenuLeftComponent } from './menu-left.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const createRouterFake = (initialUrl = '/') => {
  const events$ = new Subject<NavigationEnd>();
  return {
    url: initialUrl,
    navigateByUrl: vi.fn(),
    events: events$,
  };
};

const createTabsFake = () => ({
  addTrialCreate: vi.fn(),
  addTrialList: vi.fn(),
  addCalendarTrials: vi.fn(),
});

const createAuthServiceFake = () => ({
  userRoles: vi.fn().mockReturnValue([Role.INTAQALAB_ADMIN]),
  hasAnyRole: vi.fn().mockReturnValue(true),
});

const setup = async (options: { initialUrl?: string; collapsed?: boolean } = {}) => {
  const { initialUrl = '/', collapsed = false } = options;

  const user = userEvent.setup();
  const routerFake = createRouterFake(initialUrl);
  const tabsFake = createTabsFake();
  const authFake = createAuthServiceFake();
  const collapsedChangeSpy = vi.fn();

  const view = await render(MenuLeftComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      { provide: Router, useValue: routerFake },
      { provide: CommandsTabService, useValue: tabsFake },
      { provide: AuthService, useValue: authFake },
      provideTestingEnvironment(),
    ],
    componentInputs: { collapsed },
    on: { collapsedChange: collapsedChangeSpy },
  });

  return { user, view, routerFake, tabsFake, collapsedChangeSpy };
};

describe('MenuLeftComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render without errors', async () => {
      const { view } = await setup();
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('should display the logo images', async () => {
      await setup();
      expect(screen.getAllByAltText('Logo').length).toBe(2);
    });

    it('should render the toggle menu button', async () => {
      await setup();
      expect(screen.getByRole('button', { name: /colapsar menu lateral/i })).toBeInTheDocument();
    });
  });

  describe('toggle menu collapse', () => {
    it('should emit collapsedChange(true) when clicking toggle while expanded', async () => {
      const { user, collapsedChangeSpy } = await setup({ collapsed: false });

      const toggleBtn = screen.getByRole('button', { name: /colapsar menu lateral/i });
      await user.click(toggleBtn);

      expect(collapsedChangeSpy).toHaveBeenCalledWith(true);
    });

    it('should emit collapsedChange(false) when clicking toggle while collapsed', async () => {
      const { user, collapsedChangeSpy } = await setup({ collapsed: true });

      const toggleBtn = screen.getByRole('button', { name: /expandir menu lateral/i });
      await user.click(toggleBtn);

      expect(collapsedChangeSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('expanded mode navigation', () => {
    it('should navigate to /execution when clicking the Execution menu item', async () => {
      const { user, routerFake } = await setup({ collapsed: false });

      const executionBtn = screen.getByRole('button', { name: /MENU_LEFT\.EXECUTION/i });
      await user.click(executionBtn);

      expect(routerFake.navigateByUrl).toHaveBeenCalledWith('/execution');
    });

    it('should navigate to /master-data/trial-type when clicking Tipo de prueba', async () => {
      const { user, routerFake } = await setup({ collapsed: false });

      const btn = screen.getByRole('button', { name: /MENU_LEFT\.CATALOG\.OPTIONS\.TRIAL_TYPE/i });
      await user.click(btn);

      expect(routerFake.navigateByUrl).toHaveBeenCalledWith('/master-data/trial-type');
    });

    it('should call tabsService.addTrialCreate when clicking Nueva Prueba de Fuego', async () => {
      const { user, tabsFake } = await setup({ collapsed: false });

      const btn = screen.getByRole('button', { name: /MENU_LEFT\.GESTION_TRIALS_NEW/i });
      await user.click(btn);

      expect(tabsFake.addTrialCreate).toHaveBeenCalledOnce();
    });

    it('should call tabsService.addCalendarTrials when clicking Calendar Trials', async () => {
      const { user, tabsFake } = await setup({ collapsed: false });

      const btn = screen.getByRole('button', { name: /MENU_LEFT\.CALENDAR_TRIALS/i });
      await user.click(btn);

      expect(tabsFake.addCalendarTrials).toHaveBeenCalledOnce();
    });
  });

  describe('collapsed mode navigation', () => {
    it('should expand a group when clicking a section with children', async () => {
      const { user } = await setup({ collapsed: true });

      const gestionBtn = screen.getByTitle(/MENU_LEFT\.GESTION_TRIALS/i);
      await user.click(gestionBtn);

      expect(screen.getByLabelText(/MENU_LEFT\.GESTION_TRIALS_NEW/i)).toBeInTheDocument();
    });

    it('should collapse an expanded group when clicking the same section again', async () => {
      const { user } = await setup({ collapsed: true });

      const gestionBtn = screen.getByTitle(/MENU_LEFT\.GESTION_TRIALS/i);
      await user.click(gestionBtn);
      await user.click(gestionBtn);

      expect(screen.queryByLabelText(/MENU_LEFT\.GESTION_TRIALS_NEW/i)).not.toBeInTheDocument();
    });

    it('should navigate to /execution when clicking Execution in collapsed mode', async () => {
      const { user, routerFake } = await setup({ collapsed: true });

      const executionBtn = screen.getByTitle(/MENU_LEFT\.EXECUTION/i);
      await user.click(executionBtn);

      expect(routerFake.navigateByUrl).toHaveBeenCalledWith('/execution');
    });

    it('should navigate to child route when clicking a child item in a collapsed expanded group', async () => {
      const { user, routerFake } = await setup({ collapsed: true });

      const catalogBtn = screen.getByTitle(/MENU_LEFT\.CATALOG\.TITLE/i);
      await user.click(catalogBtn);

      const trialTypeBtn = await screen.findByLabelText(/MENU_LEFT\.CATALOG\.OPTIONS\.TRIAL_TYPE/i);
      await user.click(trialTypeBtn);

      expect(routerFake.navigateByUrl).toHaveBeenCalledWith('/master-data/trial-type');
    });
  });

  describe('active state', () => {
    it('should mark the Execution button as active when navigated to /execution', async () => {
      await setup({ initialUrl: '/execution', collapsed: false });

      const execBtn = screen.getByRole('button', { name: /MENU_LEFT\.EXECUTION/i });
      expect(execBtn).toHaveAttribute('data-active', 'true');
    });

    it('should not mark any button as active on unknown URL', async () => {
      await setup({ initialUrl: '/', collapsed: false });

      const activeButtons = document.querySelectorAll('[data-active="true"]');
      expect(activeButtons.length).toBe(0);
    });
  });
});
