import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it } from 'vitest';

import { SkeletonTable } from './skeleton-table';

const withTranslate = {
  imports: [TranslateModule.forRoot({ defaultLanguage: 'es' })],
};

describe('SkeletonTable', () => {
  it('renders with role="status" and aria-busy', async () => {
    const { container } = await render(SkeletonTable, withTranslate);
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toBeTruthy();
    expect(wrapper?.getAttribute('aria-busy')).toBe('true');
  });

  it('renders default 4 columns x 5 rows', async () => {
    const { container } = await render(SkeletonTable, withTranslate);
    const skeletons = container.querySelectorAll('ui-skeleton');
    // header: 4 + body: 5*4 = 24
    expect(skeletons.length).toBe(24);
  });

  it('renders correct number of columns and rows with custom values', async () => {
    const { container } = await render(SkeletonTable, {
      ...withTranslate,
      componentInputs: { columns: 3, rows: 2 },
    });
    const skeletons = container.querySelectorAll('ui-skeleton');
    // header: 3 + body: 2*3 = 9
    expect(skeletons.length).toBe(9);
  });

  it('hides header row when showHeader is false', async () => {
    const { container } = await render(SkeletonTable, {
      ...withTranslate,
      componentInputs: { columns: 3, rows: 2, showHeader: false },
    });
    const skeletons = container.querySelectorAll('ui-skeleton');
    // body only: 2*3 = 6
    expect(skeletons.length).toBe(6);
  });

  it('renders header row with bg-client-neutral-50 when showHeader is true', async () => {
    const { container } = await render(SkeletonTable, withTranslate);
    const headerRow = container.querySelector('.bg-client-neutral-50');
    expect(headerRow).toBeTruthy();
  });

  it('applies wave animation class to skeletons by default', async () => {
    const { container } = await render(SkeletonTable, withTranslate);
    const firstSkeleton = container.querySelector('ui-skeleton');
    expect(firstSkeleton?.className).toContain('inta-skeleton-wave');
  });

  it('applies pulse animation when configured', async () => {
    const { container } = await render(SkeletonTable, {
      ...withTranslate,
      componentInputs: { animation: 'pulse' as const },
    });
    const firstSkeleton = container.querySelector('ui-skeleton');
    expect(firstSkeleton?.className).toContain('animate-pulse');
  });

  it('renders border separators between rows', async () => {
    const { container } = await render(SkeletonTable, {
      ...withTranslate,
      componentInputs: { rows: 3 },
    });
    const borderedRows = container.querySelectorAll('.border-b');
    // Header has border-b (1) + First 2 body rows have border-b (2) = 3
    expect(borderedRows.length).toBe(3);
  });

});
