import { getColorTheme } from './colors.ts';

// Re-export only used exports
export { getColorTheme };

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('theme index', () => {
    test('should export color theme function', async () => {
      const colors = await import('./colors.ts');
      expect(typeof colors.getColorTheme).toBe('function');
    });
  });
}
