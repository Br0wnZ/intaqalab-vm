import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { BreadcrumbService } from '../../services/breadcrumb/breadcrumb.service';
import { BreadcrumbComponent } from './breadcrumb.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

type BreadcrumbItem = { label: string; url: string };

async function setup(items: BreadcrumbItem[] = []) {
  const mockBreadcrumbService = { items: signal(items) };

  const view = await render(BreadcrumbComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideTestingEnvironment(),
      provideRouter([]),
      { provide: BreadcrumbService, useValue: mockBreadcrumbService },
    ],
  });

  return { view, mockBreadcrumbService };
}

describe('BreadcrumbComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render the nav landmark with accessible label', async () => {
      await setup([{ label: 'HOME', url: '/' }]);
      expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toBeTruthy();
    });

    it('should not render the list when no items are provided', async () => {
      await setup([]);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should render an ordered list when items are provided', async () => {
      await setup([{ label: 'HOME', url: '/' }]);
      expect(screen.getByRole('list')).toBeTruthy();
    });
  });

  describe('breadcrumb items', () => {
    it('should render non-last items as links with correct href', async () => {
      await setup([
        { label: 'HOME', url: '/' },
        { label: 'PRODUCTS', url: '/products' },
        { label: 'DETAILS', url: '/products/1' },
      ]);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0].getAttribute('href')?.endsWith('/')).toBe(true);
      expect(links[1].getAttribute('href')?.endsWith('/products')).toBe(true);
    });

    it('should render the last item as a span with aria-current="page"', async () => {
      await setup([
        { label: 'HOME', url: '/' },
        { label: 'DETAILS', url: '/details' },
      ]);

      const currentItem = screen.getByText('DETAILS');
      expect(currentItem.tagName).toBe('SPAN');
      expect(currentItem.getAttribute('aria-current')).toBe('page');
    });

    it('should not add aria-current to non-last items', async () => {
      await setup([
        { label: 'HOME', url: '/' },
        { label: 'DETAILS', url: '/details' },
      ]);

      const homeLink = screen.getByText('HOME');
      expect(homeLink.getAttribute('aria-current')).toBeNull();
    });

    it('should render a single item as the current page (no links)', async () => {
      await setup([{ label: 'HOME', url: '/' }]);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      const currentItem = screen.getByText('HOME');
      expect(currentItem.getAttribute('aria-current')).toBe('page');
    });
  });
});
