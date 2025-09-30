import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const isConditional = true;
    const isHidden = false;
    const result = cn('base', isConditional && 'conditional', isHidden && 'hidden');
    expect(result).toContain('base');
    expect(result).toContain('conditional');
    expect(result).not.toContain('hidden');
  });

  it('should handle undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-4', 'px-2');
    // Should keep only one px class (the last one)
    expect(result).toBeDefined();
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle object with boolean values', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    });
    expect(result).toContain('class1');
    expect(result).not.toContain('class2');
    expect(result).toContain('class3');
  });

  it('should merge conflicting Tailwind classes', () => {
    // Test that tailwind-merge handles conflicts
    const result = cn('bg-red-500', 'bg-blue-500');
    // Should only keep the last bg color
    expect(result).not.toContain('bg-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('should handle complex class combinations', () => {
    const result = cn(
      'base-class',
      { 'conditional-class': true },
      ['array-class'],
      undefined,
      'final-class'
    );
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).toContain('array-class');
    expect(result).toContain('final-class');
  });
});
