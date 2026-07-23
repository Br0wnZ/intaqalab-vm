import { render } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton';

const withTranslate = {
  imports: [TranslateModule.forRoot({ defaultLanguage: 'es' })],
};

describe('Skeleton', () => {
  it('renders with role="status"', async () => {
    const { container } = await render(Skeleton, withTranslate);
    expect(container.querySelector('ui-skeleton')?.getAttribute('role')).toBe('status');
  });

  it('renders with aria-busy="true"', async () => {
    const { container } = await render(Skeleton, withTranslate);
    expect(container.querySelector('ui-skeleton')?.getAttribute('aria-busy')).toBe('true');
  });

  it('applies bg-client-neutral-200 base class', async () => {
    const { container } = await render(Skeleton, withTranslate);
    expect(container.querySelector('ui-skeleton')?.className).toContain('bg-client-neutral-200');
  });

  it('applies pulse animation class by default', async () => {
    const { container } = await render(Skeleton, withTranslate);
    expect(container.querySelector('ui-skeleton')?.className).toContain('animate-pulse');
  });

  it('applies wave animation class when animation="wave"', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { animation: 'wave' as const },
    });
    expect(container.querySelector('ui-skeleton')?.className).toContain('inta-skeleton-wave');
  });

  it('does not apply animation class when animation="none"', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { animation: 'none' as const },
    });
    const el = container.querySelector('ui-skeleton');
    expect(el?.className).not.toContain('animate-pulse');
    expect(el?.className).not.toContain('inta-skeleton-wave');
  });

  it('applies circle variant classes', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { variant: 'circle' as const },
    });
    expect(container.querySelector('ui-skeleton')?.className).toContain('rounded-full');
  });

  it('applies text variant classes', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { variant: 'text' as const },
    });
    expect(container.querySelector('ui-skeleton')?.className).toContain('h-[1em]');
  });

  it('applies button variant h-9 class', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { variant: 'button' as const },
    });
    expect(container.querySelector('ui-skeleton')?.className).toContain('h-9');
  });

  it('binds width style', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { width: '200px' },
    });
    const el = container.querySelector('ui-skeleton') as HTMLElement;
    expect(el?.style.width).toBe('200px');
  });

  it('binds height style', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { height: '80px' },
    });
    const el = container.querySelector('ui-skeleton') as HTMLElement;
    expect(el?.style.height).toBe('80px');
  });

  it('merges custom class via class input', async () => {
    const { container } = await render(Skeleton, {
      ...withTranslate,
      componentInputs: { class: 'my-custom-class' },
    });
    expect(container.querySelector('ui-skeleton')?.className).toContain('my-custom-class');
  });

  it('renders sr-only span for screen reader', async () => {
    const { container } = await render(Skeleton, withTranslate);
    expect(container.querySelector('.sr-only')).toBeTruthy();
  });
});
