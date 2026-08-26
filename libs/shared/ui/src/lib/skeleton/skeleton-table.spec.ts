import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { SkeletonTable } from './skeleton-table';

const baseConfig = {
  imports: [TranslateModule.forRoot()],
  providers: [provideTestingEnvironment()],
};

describe('SkeletonTable', () => {
  it('renders with role="status" and aria-busy="true"', async () => {
    await render(SkeletonTable, baseConfig);

    const [tableStatus] = screen.getAllByRole('status');
    expect(tableStatus).toBeInTheDocument();
    expect(tableStatus).toHaveAttribute('aria-busy', 'true');
  });

  it('renders default 4 columns x 5 rows plus header (24 skeletons in total)', async () => {
    await render(SkeletonTable, baseConfig);

    const skeletons = screen.getAllByLabelText('UI.SKELETON.LOADING');
    // Header: 4 cols + Body: 5 rows * 4 cols = 24 skeletons
    expect(skeletons).toHaveLength(24);
  });

  it('renders correct number of columns and rows with custom values', async () => {
    await render(SkeletonTable, {
      ...baseConfig,
      componentInputs: { columns: 3, rows: 2 },
    });

    const skeletons = screen.getAllByLabelText('UI.SKELETON.LOADING');
    // Header: 3 cols + Body: 2 rows * 3 cols = 9 skeletons
    expect(skeletons).toHaveLength(9);
  });

  it('renders header skeletons when showHeader is true by default', async () => {
    await render(SkeletonTable, {
      ...baseConfig,
      componentInputs: { columns: 3, rows: 2, showHeader: true },
    });

    const skeletons = screen.getAllByLabelText('UI.SKELETON.LOADING');
    // 3 header + 6 body = 9 skeletons
    expect(skeletons).toHaveLength(9);
  });

  it('hides header row when showHeader is false', async () => {
    await render(SkeletonTable, {
      ...baseConfig,
      componentInputs: { columns: 3, rows: 2, showHeader: false },
    });

    const skeletons = screen.getAllByLabelText('UI.SKELETON.LOADING');
    // Body only: 2 rows * 3 cols = 6 skeletons (no header)
    expect(skeletons).toHaveLength(6);
  });

  it('applies wave animation class to skeletons by default', async () => {
    await render(SkeletonTable, baseConfig);

    const [, ...skeletons] = screen.getAllByRole('status');
    expect(skeletons[0]).toHaveClass('inta-skeleton-wave');
  });

  it('applies pulse animation when configured', async () => {
    await render(SkeletonTable, {
      ...baseConfig,
      componentInputs: { animation: 'pulse' as const },
    });

    const [, ...skeletons] = screen.getAllByRole('status');
    expect(skeletons[0]).toHaveClass('animate-pulse');
  });

  it('applies no animation class when animation="none"', async () => {
    await render(SkeletonTable, {
      ...baseConfig,
      componentInputs: { animation: 'none' as const },
    });

    const [, ...skeletons] = screen.getAllByRole('status');
    expect(skeletons[0]).not.toHaveClass('animate-pulse');
    expect(skeletons[0]).not.toHaveClass('inta-skeleton-wave');
  });

  it('calculates dynamic header and cell widths correctly', async () => {
    const { fixture } = await render(SkeletonTable, baseConfig);
    const component = fixture.componentInstance;

    expect(component.headerWidth(1)).toBe('45%');
    expect(component.headerWidth(2)).toBe('60%');
    expect(component.cellWidth(1, 1)).toBe('90%');
  });
});
