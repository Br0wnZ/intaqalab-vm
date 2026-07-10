/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../+state/execution.store';
import { TrialSelectorDialog } from './dialogs/trial-selector-dialog';
import { Execution } from './execution';
import { WidgetId } from './models/widget-id.enum';
import { WidgetStateService } from './services/widget-state.service';

@Injectable()
class MockMatDialog extends MatDialog {
  override open(component: any, config: any): any {
    if (component === TrialSelectorDialog) {
      return {
        afterClosed: () => of(null),
        close: () => {
          /* empty */
        },
      };
    }
    return super.open(component, config);
  }
}

describe('Execution', () => {
  const setup = async () => {
    const user = userEvent.setup();
    const view = await render(Execution, {
      imports: [NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ExecutionStore,
        {
          provide: AuthService,
          useValue: {
            getUserData: () => ({
              preferred_username: 'test_user',
              name: 'Test User',
              roles: ['SYSTEM_ADMIN'],
            }),
          },
        },
        {
          provide: MatDialog,
          useClass: MockMatDialog,
        },
      ],
    });

    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(view.fixture);
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, rootLoader, loader };
  };

  it('renders the execution basic details', async () => {
    await setup();
    expect(screen.getByText('034A/25')).toBeInTheDocument();
    expect(screen.getByText('Cliente: RHEINMETALL EXPAL MUNITIONS')).toBeInTheDocument();
  });

  it('toggles the widgets sidebar panel visibility', async () => {
    const { user } = await setup();

    const toggleBtn = screen.getByRole('button', { name: /TRIAL_EXECUTION\.WIDGETS_BTN/i });
    expect(toggleBtn).toBeInTheDocument();

    await user.click(toggleBtn);

    const libraryTitle = screen.getByText('TRIAL_EXECUTION.WIDGET_LIBRARY_TITLE');
    expect(libraryTitle).toBeInTheDocument();
  });

  it('allows toggling the edit mode via slide toggle', async () => {
    const { loader } = await setup();
    const slideToggle = await loader.getHarness(MatSlideToggleHarness.with({ label: /TRIAL_EXECUTION\.EDIT_PANEL/i }));

    expect(await slideToggle.isChecked()).toBe(false);
    await slideToggle.toggle();
    expect(await slideToggle.isChecked()).toBe(true);
  });

  it('opens the actions menu and can trigger the interrupt dialog', async () => {
    const { loader, rootLoader } = await setup();

    // Expand the Actions menu
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();

    // Find the 'Action Stop' item
    const items = await menu.getItems();
    let interruptItem = null;
    for (const item of items) {
      const text = await item.getText();
      if (text.includes('TRIAL_EXECUTION.ACTION_STOP')) {
        interruptItem = item;
        break;
      }
    }

    expect(interruptItem).toBeTruthy();
    await interruptItem!.click();

    // Verify the dialog was opened
    const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
    expect(dialogs.length).toBe(1);

    const dialogTitle = await dialogs[0].getTitleText();
    expect(dialogTitle).toContain('Interrumpir prueba de fuego');
  });

  describe('User Preferences Layout', () => {
    it('loads preferences on init and paints widgets using WidgetId enum', async () => {
      const view = await render(Execution, {
        imports: [NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          provideTestingEnvironment(),
          provideHttpClient(),
          provideHttpClientTesting(),
          ExecutionStore,
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'fireTrialId' ? '3fa85f64-5717-4562-b3fc-2c963f66afa6' : null),
                },
              },
            },
          },
          {
            provide: AuthService,
            useValue: {
              getUserData: () => ({
                preferred_username: 'test_user',
                name: 'Test User',
                roles: ['SYSTEM_ADMIN'],
              }),
            },
          },
        ],
      });

      const httpMock = view.fixture.debugElement.injector.get(HttpTestingController);
      const widgetStateService = view.fixture.debugElement.injector.get(WidgetStateService);

      // Expect and flush GET preferences
      const getPrefReq = httpMock.expectOne(
        (req) => req.method === 'GET' && req.url.includes('/execution/preferences/users/test_user'),
      );
      getPrefReq.flush({ widgetsLayout: [WidgetId.SHOT] });

      // Wait for signals/effects to resolve
      view.fixture.detectChanges();

      // Verify that the widget was added to the grid
      expect(widgetStateService.placedWidgets().length).toBe(1);
      expect(widgetStateService.placedWidgets()[0].type).toBe(WidgetId.SHOT);
    });

    it('saves preferences on destroy using WidgetId enum', async () => {
      const view = await render(Execution, {
        imports: [NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          provideTestingEnvironment(),
          provideHttpClient(),
          provideHttpClientTesting(),
          ExecutionStore,
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'fireTrialId' ? '3fa85f64-5717-4562-b3fc-2c963f66afa6' : null),
                },
              },
            },
          },
          {
            provide: AuthService,
            useValue: {
              getUserData: () => ({
                preferred_username: 'test_user',
                name: 'Test User',
                roles: ['SYSTEM_ADMIN'],
              }),
            },
          },
        ],
      });

      const httpMock = view.fixture.debugElement.injector.get(HttpTestingController);
      const widgetStateService = view.fixture.debugElement.injector.get(WidgetStateService);

      // Expect and flush GET preferences
      const getPrefReq = httpMock.expectOne(
        (req) => req.method === 'GET' && req.url.includes('/execution/preferences/users/test_user'),
      );
      getPrefReq.flush({ widgetsLayout: [WidgetId.SHOT] });

      view.fixture.detectChanges();

      // Trigger destroy to save preferences
      view.fixture.destroy();

      // Expect and verify PUT preferences call
      const putPrefReq = httpMock.expectOne(
        (req) => req.method === 'PUT' && req.url.includes('/execution/preferences/users/test_user'),
      );
      expect(putPrefReq.request.body).toEqual({ widgetsLayout: [WidgetId.SHOT] });
      putPrefReq.flush({ success: true });
    });
  });
});
