import { getColorTheme, getIconSet } from './colors.ts';

// Re-export only used exports
export { getColorTheme, getIconSet };

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('theme index', () => {
    test('should export color and icon functions', async () => {
      const colors = await import('./colors.ts');
      expect(typeof colors.getColorTheme).toBe('function');
      expect(typeof colors.getIconSet).toBe('function');
    });
  });
}
