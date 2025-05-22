import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('combines class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    
    expect(cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    )).toBe('base-class active-class');
  });

  it('handles object syntax', () => {
    expect(cn(
      'base-class',
      {
        'active-class': true,
        'disabled-class': false,
        'hidden-class': true
      }
    )).toBe('base-class active-class hidden-class');
  });

  it('handles mixed inputs', () => {
    const isPrimary = true;
    
    expect(cn(
      'base-class',
      isPrimary && 'primary-class',
      {
        'large-class': true,
        'small-class': false
      },
      ['array-class-1', 'array-class-2']
    )).toBe('base-class primary-class large-class array-class-1 array-class-2');
  });

  it('filters out falsy values', () => {
    expect(cn(
      'base-class',
      false ? 'false-class' : '',
      null,
      undefined,
      0 ? 'zero-class' : '',
      ''
    )).toBe('base-class');
  });
}); 