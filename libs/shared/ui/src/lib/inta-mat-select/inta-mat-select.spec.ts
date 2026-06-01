/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { IntaSignalSelectComponent } from './inta-mat-select';

describe('IntaMatSelect', () => {
  it('renders label and placeholder', async () => {
    await render(IntaSignalSelectComponent, {
      componentProperties: {
        label: () => 'My Label',
        placeholder: () => 'Select...',
        options: () => [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
        valueKey: () => 'value',
        labelKey: () => 'label',
      } as any,
      excludeComponentDeclaration: true,
    });

    expect(screen.getByText('My Label')).toBeTruthy();
    expect(screen.getByText('Select...')).toBeTruthy();
  });

  it('accepts arbitrary option objects when valueKey/labelKey provided', async () => {
    const clients = [
      { id: 1, name: 'Client One' },
      { id: 2, name: 'Client Two' },
    ];

    await render(IntaSignalSelectComponent, {
      componentProperties: {
        label: () => 'Clients',
        placeholder: () => 'Choose a client',
        options: () => clients,
        valueKey: () => 'id',
        labelKey: () => 'name',
      } as any,
      excludeComponentDeclaration: true,
    });

    expect(screen.getByText('Clients')).toBeTruthy();
    expect(screen.getByText('Choose a client')).toBeTruthy();
    expect(screen.queryByText('Client One')).toBeFalsy();
  });

  it('shows and filters options with search input (Signal API)', async () => {
    const options = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];

    const { fixture } = await render(IntaSignalSelectComponent, {
      componentProperties: {
        label: () => 'Searchable',
        placeholder: () => 'Buscar...',
        options: () => options,
        valueKey: () => 'value',
        labelKey: () => 'label',
        searchable: () => true,
      } as any,
      excludeComponentDeclaration: true,
    });

    // Usar MatSelectHarness para abrir el panel
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(MatSelectHarness);

    await select.open();

    // Buscar el input en el overlay global
    const searchInput = document.body.querySelector('input.search-input') as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    // Simular escribir en el input de búsqueda
    await userEvent.type(searchInput, 'be');

    // Esperar a que solo la opción filtrada esté visible
    expect(screen.queryByText('Alpha')).toBeFalsy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.queryByText('Gamma')).toBeFalsy();
  });
});
