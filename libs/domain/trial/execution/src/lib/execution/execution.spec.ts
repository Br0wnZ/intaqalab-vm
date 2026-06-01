// import { HarnessLoader } from '@angular/cdk/testing';
// import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
// import { provideHttpClient } from '@angular/common/http';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { MatDialogHarness } from '@angular/material/dialog/testing';
// import { MatMenuHarness } from '@angular/material/menu/testing';
// import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
// import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// import { provideTestingEnvironment } from '@intaqalab/config';
// import { TranslateModule } from '@ngx-translate/core';
// import { render, screen } from '@testing-library/angular';
// import userEvent from '@testing-library/user-event';
// import { describe, expect, it } from 'vitest';

// import { Execution } from './execution';

// describe('Execution', () => {
//   const setup = async () => {
//     const user = userEvent.setup();
//     const view = await render(Execution, {
//       imports: [NoopAnimationsModule, TranslateModule.forRoot()],
//       providers: [provideTestingEnvironment(), provideHttpClient(), provideHttpClientTesting()],
//     });

//     const rootLoader = TestbedHarnessEnvironment.documentRootLoader(view.fixture);
//     const loader = TestbedHarnessEnvironment.loader(view.fixture);

//     return { user, view, rootLoader, loader };
//   };

//   it('renders the execution basic details', async () => {
//     await setup();
//     expect(screen.getByText('034A/25')).toBeInTheDocument();
//     expect(screen.getByText('Cliente: RHEINMETALL EXPAL MUNITIONS')).toBeInTheDocument();
//   });

//   it('toggles the widgets sidebar panel visibility', async () => {
//     const { user } = await setup();

//     const toggleBtn = screen.getByRole('button', { name: /TRIAL_EXECUTION\.WIDGETS_BTN/i });
//     expect(toggleBtn).toBeInTheDocument();

//     await user.click(toggleBtn);

//     const libraryTitle = screen.getByText('TRIAL_EXECUTION.WIDGET_LIBRARY_TITLE');
//     expect(libraryTitle).toBeInTheDocument();
//   });

//   it('allows toggling the edit mode via slide toggle', async () => {
//     const { loader } = await setup();
//     const slideToggle = await loader.getHarness(MatSlideToggleHarness.with({ label: /TRIAL_EXECUTION\.EDIT_PANEL/i }));

//     expect(await slideToggle.isChecked()).toBe(false);
//     await slideToggle.toggle();
//     expect(await slideToggle.isChecked()).toBe(true);
//   });

//   it('opens the actions menu and can trigger the interrupt dialog', async () => {
//     const { loader, rootLoader } = await setup();

//     // Expand the Actions menu
//     const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
//     await menu.open();

//     // Find the 'Action Stop' item
//     const items = await menu.getItems();
//     let interruptItem = null;
//     for (const item of items) {
//       const text = await item.getText();
//       if (text.includes('TRIAL_EXECUTION.ACTION_STOP')) {
//         interruptItem = item;
//         break;
//       }
//     }

//     expect(interruptItem).toBeTruthy();
//     await interruptItem!.click();

//     // Verify the dialog was opened
//     const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
//     expect(dialogs.length).toBe(1);

//     const dialogTitle = await dialogs[0].getTitleText();
//     expect(dialogTitle).toContain('Interrumpir prueba de fuego');
//   });
// });
