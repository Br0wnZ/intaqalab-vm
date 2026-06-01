import { render, screen } from '@testing-library/angular';

import { Badge } from './badge.component';

describe('Badge', () => {
  let customRender: (template: string) => ReturnType<typeof render>;

  beforeEach(() => {
    customRender = (template: string) =>
      render(template, {
        imports: [Badge],
      });
  });

  it('should projects the content correctly and use default variant', async () => {
    await customRender(`
      <ui-badge>Texto 1</ui-badge>
      <small uiBadge role="status">Texto 2</small>
    `);
    expect(screen.getByText(/Texto 1/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Texto 2');
  });

  it('should projects the content correctly and use secondary variant', async () => {
    await customRender(`
      <ui-badge variant="secondary">Texto 1</ui-badge>
      <small uiBadge variant="secondary" role="status">Texto 2</small>
    `);
    expect(screen.getByText(/Texto 1/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Texto 2');
  });

  it('should merge custom class with variant', async () => {
    const mergeClass = 'p-12';
    await customRender(`<ui-badge class="${mergeClass}">Texto 1</ui-badge>`);
    expect(screen.getByText(/Texto 1/i)).toHaveClass(mergeClass);
  });
});
