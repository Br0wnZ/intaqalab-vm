import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton';

const withTranslate = { providers: [provideTranslateService({ fallbackLang: 'es' })] };

describe('Skeleton', () => {
  it('renders with role="status"', async () => {
    await render(Skeleton, withTranslate);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with aria-busy="true"', async () => {
    await render(Skeleton, withTranslate);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('applies background-color style as base', async () => {
    await render(Skeleton, withTranslate);
    expect(screen.getByRole('status')).toHaveStyle({ backgroundColor: 'rgb(229, 231, 235)' });
  });

  it('applies pulse animation class by default', async () => {
    await render(Skeleton, withTranslate);
    expect(screen.getByRole('status')).toHaveClass('animate-pulse');
  });

  it('applies wave animation class when animation="wave"', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { animation: 'wave' as const },
    });
    expect(screen.getByRole('status')).toHaveClass('inta-skeleton-wave');
  });

  it('does not apply animation class when animation="none"', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { animation: 'none' as const },
    });
    const status = screen.getByRole('status');
    expect(status).not.toHaveClass('animate-pulse');
    expect(status).not.toHaveClass('inta-skeleton-wave');
  });

  it('applies circle variant classes', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { variant: 'circle' as const },
    });
    expect(screen.getByRole('status')).toHaveClass('rounded-full');
  });

  it('applies text variant classes', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { variant: 'text' as const },
    });
    expect(screen.getByRole('status')).toHaveClass('h-[1em]');
  });

  it('applies button variant h-9 class', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { variant: 'button' as const },
    });
    expect(screen.getByRole('status')).toHaveClass('h-9');
  });

  it('binds width style', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { width: '200px' },
    });
    expect(screen.getByRole('status')).toHaveStyle({ width: '200px' });
  });

  it('binds height style', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { height: '80px' },
    });
    expect(screen.getByRole('status')).toHaveStyle({ height: '80px' });
  });

  it('merges custom class via class input', async () => {
    await render(Skeleton, {
      ...withTranslate,
      componentInputs: { class: 'my-custom-class' },
    });
    expect(screen.getByRole('status')).toHaveClass('my-custom-class');
  });

  it('renders sr-only span for screen reader', async () => {
    await render(Skeleton, withTranslate);
    expect(screen.getByLabelText('UI.SKELETON.LOADING')).toHaveClass('sr-only');
  });
});
