import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('joins class names using clsx semantics', () => {
    expect(cn('button', 'button', 'primary')).toBe('button button primary');
  });

  it('ignores falsy values and merges objects', () => {
    expect(cn('card', undefined, { hidden: false, active: true })).toBe('card active');
  });

  it('flattens nested arrays of class names', () => {
    expect(cn('grid', ['md:grid-cols-2', null], ['gap-4'])).toBe('grid md:grid-cols-2 gap-4');
  });
});
