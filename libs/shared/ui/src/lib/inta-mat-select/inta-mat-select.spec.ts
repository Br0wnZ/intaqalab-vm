/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
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

    expect(screen.getByText('My Label')).toBeInTheDocument();
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('renders a Material floating label when configured', async () => {
    await render(IntaSignalSelectComponent, {
      componentProperties: {
        label: () => 'Floating label',
        placeholder: () => 'Select...',
        options: () => [{ value: 'a', label: 'Option A' }],
        valueKey: () => 'value',
        labelKey: () => 'label',
        floatLabel: () => 'always',
      } as any,
      excludeComponentDeclaration: true,
    });

    expect(screen.getByText('Floating label', { selector: 'mat-label' })).toBeInTheDocument();
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

    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Choose a client')).toBeInTheDocument();
    expect(screen.queryByText('Client One')).not.toBeInTheDocument();
  });

  it('shows and filters options with search input (Signal API)', async () => {
    const options = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];

    const { fixture } = await render(IntaSignalSelectComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideTestingEnvironment()],
      componentInputs: {
        label: 'Searchable',
        placeholder: 'Buscar...',
        options,
        valueKey: 'value',
        labelKey: 'label',
        searchable: true,
      },
    });

    const user = userEvent.setup();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const [select] = await loader.getAllHarnesses(MatSelectHarness);

    await select.open();

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), 'be');
    fixture.detectChanges();

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });
});
