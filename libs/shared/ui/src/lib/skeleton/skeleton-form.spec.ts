import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { SkeletonForm } from './skeleton-form';

const withTranslate = { providers: [provideTranslateService({ fallbackLang: 'es' })] };

describe('SkeletonForm', () => {
  it('renders with role="status" and aria-busy', async () => {
    await render(SkeletonForm, withTranslate);
    const [wrapper] = screen.getAllByRole('status');
    expect(wrapper).toHaveAttribute('aria-busy', 'true');
  });

  it('renders default 4 fields (label + input per field)', async () => {
    const { fixture } = await render(SkeletonForm, withTranslate);
    const skeletons = fixture.debugElement.queryAll(By.css('ui-skeleton'));
    // 4 fields × 2 (label + input) + 2 action buttons = 10
    expect(skeletons).toHaveLength(10);
  });

  it('renders correct number of fields with custom value', async () => {
    const { fixture } = await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { fields: 6 },
    });
    const skeletons = fixture.debugElement.queryAll(By.css('ui-skeleton'));
    // 6 fields × 2 + 2 buttons = 14
    expect(skeletons).toHaveLength(14);
  });

  it('hides action buttons when showActions is false', async () => {
    const { fixture } = await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { fields: 3, showActions: false },
    });
    const skeletons = fixture.debugElement.queryAll(By.css('ui-skeleton'));
    // 3 fields × 2 = 6, no buttons
    expect(skeletons).toHaveLength(6);
  });

  it('renders action buttons when showActions is true (default)', async () => {
    const { fixture } = await render(SkeletonForm, withTranslate);
    // 2 button-variant skeletons in the actions area
    const buttonSkeletons = fixture.debugElement.queryAll(By.css('ui-skeleton[variant="button"]'));
    expect(buttonSkeletons).toHaveLength(2);
  });

  it('applies grid columns style based on columns input', async () => {
    const { fixture } = await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { columns: 3 },
    });
    const grid = fixture.debugElement.query(By.css('.grid'));
    expect(grid.styles['gridTemplateColumns'] || grid.styles['grid-template-columns']).toContain('repeat(3');
  });

  it('applies pulse animation by default', async () => {
    await render(SkeletonForm, withTranslate);
    const firstSkeleton = screen.getAllByRole('status')[1];
    expect(firstSkeleton).toHaveClass('animate-pulse');
  });

  it('applies wave animation when configured', async () => {
    await render(SkeletonForm, {
      ...withTranslate,
      componentInputs: { animation: 'wave' as const },
    });
    const firstSkeleton = screen.getAllByRole('status')[1];
    expect(firstSkeleton).toHaveClass('inta-skeleton-wave');
  });

  it('renders separator line before action buttons', async () => {
    const { fixture } = await render(SkeletonForm, withTranslate);
    const separator = fixture.debugElement.query(By.css('.bg-client-neutral-200.h-px'));
    expect(separator).not.toBeNull();
  });
});
