import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { AdminDocsSection } from './admin-docs-section';

// vi.mock hoisted by Vitest
describe('AdminDocsSection', () => {
  const setup = async () => {
    const user = userEvent.setup();

    await render(AdminDocsSection, { providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      'ADMIN.ADMIN_DOCS_SECTION.SYNC': 'Sincronizando',
      'ADMIN.ADMIN_DOCS_SECTION.NO_RESULTS': 'No encontrado',
    });
    translate.use('es');

    return { user };
  };

  it('should display the loading status and then render the documents', async () => {
    await setup();
    expect(screen.getByText('sync')).toBeInTheDocument();

    const rowItems = await screen.findAllByText(/prueba fuego v\d+/i);
    expect(rowItems.length).toBeGreaterThan(0);

    expect(screen.queryByText(/sincronizando/i)).not.toBeInTheDocument();
  });

  it('should filter the table when typing in the search box', async () => {
    const { user } = await setup();
    await screen.findAllByText(/prueba fuego v\d+/i);
    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'Resultados ejecución');

    expect((screen.getAllByText(/resultados ejecución/i) || []).length).toBeGreaterThan(0);

    expect(screen.queryByText('Prueba fuego')).not.toBeInTheDocument();

    expect((screen.getAllByText(/resultados ejecución/i) || []).length).toBeGreaterThan(0);
  });

  it('should toggle the status of a document visually', async () => {
    const { user } = await setup();
    const rowItems = await screen.findAllByText(/prueba fuego v\d+/i);
    expect(rowItems.length).toBeGreaterThan(0);

    const switchButtons = screen.getAllByRole('switch');
    const secondSwitch = switchButtons[1];

    expect(secondSwitch).toBeChecked();
    expect(screen.getAllByText('Activo')[0]).toBeInTheDocument();

    await user.click(secondSwitch);

    expect(secondSwitch).not.toBeChecked();
    expect(screen.getAllByText('Inactivo').length).toBeGreaterThan(0);
  });

  it('should display "No encontrado" message if the filter does not match', async () => {
    const { user } = await setup();
    await screen.findAllByText(/prueba fuego v\d+/i);

    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'TextoQueNoExiste 12345');

    expect(await screen.findByText(/no encontrado/i)).toBeInTheDocument();
  });
});
