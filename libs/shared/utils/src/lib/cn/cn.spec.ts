import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('flex', 'gap-2', 'p-4')).toBe('flex gap-2 p-4');
  });

  it('filters out falsy values', () => {
    expect(cn('flex', false, null, undefined, 0, 'gap-2')).toBe('flex gap-2');
  });

  it('returns empty string when all values are falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
  });

  it('handles conditional classes when false', () => {
    const isActive = false;
    expect(cn('base', isActive && 'active')).toBe('base');
  });

  it('handles a single class', () => {
    expect(cn('only-class')).toBe('only-class');
  });

  it('handles no arguments', () => {
    expect(cn()).toBe('');
  });
});
