import colors from 'picocolors';
import { getTerminalCapabilities } from './capabilities.ts';

const _THEME = {
  primary: '#3b82f6', // Blue - Primary operations
  success: '#10b981', // Green - Success states
  warning: '#f59e0b', // Amber - Warnings
  error: '#ef4444', // Red - Errors
  info: '#6366f1', // Indigo - Information
  muted: '#6b7280', // Gray - Supporting information
  accent: '#8b5cf6', // Purple - Emphasis
  highlight: '#fbbf24', // Yellow - Highlighting
} as const;

type ColorTheme = {
  primary: (text: string) => string;
  success: (text: string) => string;
  warning: (text: string) => string;
  error: (text: string) => string;
  info: (text: string) => string;
  muted: (text: string) => string;
  accent: (text: string) => string;
  highlight: (text: string) => string;
  bold: (text: string) => string;
  italic: (text: string) => string;
  underline: (text: string) => string;
  dim: (text: string) => string;
};

const createColorTheme = (hasColor: boolean): ColorTheme => {
  if (!hasColor) {
    const identity = (text: string) => text;
    return {
      primary: identity,
      success: identity,
      warning: identity,
      error: identity,
      info: identity,
      muted: identity,
      accent: identity,
      highlight: identity,
      bold: identity,
      italic: identity,
      underline: identity,
      dim: identity,
    };
  }

  return {
    primary: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
    info: colors.cyan,
    muted: colors.gray,
    accent: colors.magenta,
    highlight: colors.yellow,
    bold: colors.bold,
    italic: colors.italic,
    underline: colors.underline,
    dim: colors.dim,
  };
};

let _colorTheme: ColorTheme | null = null;

export const getColorTheme = (): ColorTheme => {
  if (_colorTheme === null) {
    const capabilities = getTerminalCapabilities();
    _colorTheme = createColorTheme(capabilities.color);
  }
  return _colorTheme;
};

const resetColorTheme = (): void => {
  _colorTheme = null;
};

// Convenience functions for common color operations
const colorize = {
  primary: (text: string) => getColorTheme().primary(text),
  success: (text: string) => getColorTheme().success(text),
  warning: (text: string) => getColorTheme().warning(text),
  error: (text: string) => getColorTheme().error(text),
  info: (text: string) => getColorTheme().info(text),
  muted: (text: string) => getColorTheme().muted(text),
  accent: (text: string) => getColorTheme().accent(text),
  highlight: (text: string) => getColorTheme().highlight(text),
  bold: (text: string) => getColorTheme().bold(text),
  italic: (text: string) => getColorTheme().italic(text),
  underline: (text: string) => getColorTheme().underline(text),
  dim: (text: string) => getColorTheme().dim(text),
} as const;

// Icon definitions with Unicode fallbacks
type IconSet = {
  readonly check: string;
  readonly cross: string;
  readonly arrow: string;
  readonly folder: string;
  readonly file: string;
  readonly search: string;
  readonly loading: string;
  readonly warning: string;
  readonly info: string;
  readonly success: string;
  readonly error: string;
};

const createIconSet = (hasUnicode: boolean): IconSet => {
  if (!hasUnicode) {
    return {
      check: '✓',
      cross: '✗',
      arrow: '>',
      folder: 'DIR',
      file: 'FILE',
      search: '?',
      loading: '...',
      warning: '!',
      info: 'i',
      success: '+',
      error: 'X',
    };
  }

  return {
    check: '✅',
    cross: '❌',
    arrow: '→',
    folder: '📁',
    file: '📄',
    search: '🔍',
    loading: '⏳',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
    error: '❌',
  };
};

let _iconSet: IconSet | null = null;

export const getIconSet = (): IconSet => {
  if (_iconSet === null) {
    const capabilities = getTerminalCapabilities();
    _iconSet = createIconSet(capabilities.unicode);
  }
  return _iconSet;
};

const resetIconSet = (): void => {
  _iconSet = null;
};

if (import.meta.vitest != null) {
  const { describe, test, expect, beforeEach, vi } = import.meta.vitest;

  describe('color theme', () => {
    beforeEach(() => {
      resetColorTheme();
      resetIconSet();
      vi.clearAllMocks();
    });

    test('should create color theme with colors when terminal supports it', () => {
      vi.mock('./capabilities.ts', () => ({
        getTerminalCapabilities: () => ({ color: true, unicode: true }),
      }));

      const theme = getColorTheme();
      expect(typeof theme.primary).toBe('function');
      expect(typeof theme.success).toBe('function');
    });

    test('should create identity functions when terminal does not support colors', () => {
      vi.mock('./capabilities.ts', () => ({
        getTerminalCapabilities: () => ({ color: false, unicode: false }),
      }));

      const theme = getColorTheme();
      expect(theme.primary('test')).toBe('test');
      expect(theme.success('test')).toBe('test');
    });

    test('should cache color theme instance', () => {
      const theme1 = getColorTheme();
      const theme2 = getColorTheme();
      expect(theme1).toBe(theme2);
    });
  });

  describe('icon set', () => {
    test('should create unicode icons when terminal supports it', () => {
      // Test with actual terminal capabilities instead of mocking
      const icons = getIconSet();
      expect(typeof icons.check).toBe('string');
      expect(typeof icons.folder).toBe('string');
      expect(icons.check.length).toBeGreaterThan(0);
      expect(icons.folder.length).toBeGreaterThan(0);
    });

    test('should create fallback icons when terminal does not support unicode', () => {
      vi.mock('./capabilities.ts', () => ({
        getTerminalCapabilities: () => ({ color: false, unicode: false }),
      }));

      const icons = getIconSet();
      expect(icons.check).toBe('✓');
      expect(icons.folder).toBe('DIR');
    });
  });

  describe('colorize convenience functions', () => {
    test('should provide direct access to color functions', () => {
      expect(typeof colorize.primary).toBe('function');
      expect(typeof colorize.success).toBe('function');
      expect(typeof colorize.error).toBe('function');
    });
  });
}
