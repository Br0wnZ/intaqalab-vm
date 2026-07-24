import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it } from 'vitest';

import { SkeletonForm } from './skeleton-form';

const withTranslate = {
  imports: [TranslateModule.forRoot({ defaultLanguage: 'es' })],
};

describe('SkeletonForm', () => {
  it('renders with role="status" and aria-busy', async () => {
    const { container } = await render(SkeletonForm, withTranslate);
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toBeTruthy();
    expect(wrapper?.getAttribute('aria-busy')).toBe('true');
  });

  it('renders default 4 fields (label + input per field)', async () => {
    const { container } = await render(SkeletonForm, withTranslate);
    const skeletons = container.querySelectorAll('ui-skeleton');
    // 4 fields × 2 (label + input) + 2 action buttons = 10
    expect(skeletons.length).toBe(10);
  });

  it('renders correct number of fields with custom value', async () => {
    const { container } = await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { fields: 6 },
    });
    const skeletons = container.querySelectorAll('ui-skeleton');
    // 6 fields × 2 + 2 buttons = 14
    expect(skeletons.length).toBe(14);
  });

  it('hides action buttons when showActions is false', async () => {
    const { container } = await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { fields: 3, showActions: false },
    });
    const skeletons = container.querySelectorAll('ui-skeleton');
    // 3 fields × 2 = 6, no buttons
    expect(skeletons.length).toBe(6);
  });

  it('renders action buttons when showActions is true (default)', async () => {
    const { container } = await render(SkeletonForm, withTranslate);
    // 2 button-variant skeletons in the actions area
    const buttonSkeletons = container.querySelectorAll('ui-skeleton[variant="button"]');
    expect(buttonSkeletons.length).toBe(2);
  });

  it('applies grid columns style based on columns input', async () => {
    const { container } = await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { columns: 3 },
    });
    const grid = container.querySelector('.grid') as HTMLElement;
    expect(grid?.style.gridTemplateColumns).toContain('repeat(3');
  });

  it('applies pulse animation by default', async () => {
    const { container } = await render(SkeletonForm, withTranslate);
    const firstSkeleton = container.querySelector('ui-skeleton');
    expect(firstSkeleton?.className).toContain('animate-pulse');
  });

  it('applies wave animation when configured', async () => {
    const { container } = await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { animation: 'wave' as const },
    });
    const firstSkeleton = container.querySelector('ui-skeleton');
    expect(firstSkeleton?.className).toContain('inta-skeleton-wave');
  });

  it('renders separator line before action buttons', async () => {
    const { container } = await render(SkeletonForm, withTranslate);
    const separator = container.querySelector('.bg-client-neutral-200.h-px');
    expect(separator).toBeTruthy();
  });
});
