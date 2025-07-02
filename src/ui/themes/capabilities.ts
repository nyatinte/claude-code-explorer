import type { WriteStream } from 'node:tty';

type TerminalCapabilities = {
  readonly color: boolean;
  readonly unicode: boolean;
  readonly ansiEscapes: boolean;
  readonly width: number;
  readonly height: number;
  readonly isNarrow: boolean;
  readonly isTall: boolean;
};

export const getTerminalCapabilities = (): TerminalCapabilities => {
  const stdout = process.stdout as WriteStream;

  // Color support detection
  const supportsColor = stdout.isTTY && process.env.COLORTERM !== 'dumb';

  // Unicode support detection
  const supportsUnicode =
    (process.env.LANG?.includes('UTF-8') ?? false) ||
    process.platform === 'win32' ||
    (process.env.TERM?.includes('xterm') ?? false);

  // Terminal size detection
  const terminalSize = stdout.getWindowSize?.() || [80, 24];
  const [width, height] = terminalSize;

  return {
    color: supportsColor,
    unicode: supportsUnicode,
    ansiEscapes: supportsColor && stdout.isTTY,
    width,
    height,
    isNarrow: width < 80,
    isTall: height > 24,
  };
};

const isColorTerminal = (): boolean => {
  return getTerminalCapabilities().color;
};

const isUnicodeTerminal = (): boolean => {
  return getTerminalCapabilities().unicode;
};

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('getTerminalCapabilities', () => {
    test('should detect color support correctly', () => {
      const originalIsTTY = process.stdout.isTTY;
      const originalColorterm = process.env.COLORTERM;

      try {
        (process.stdout as WriteStream).isTTY = true;
        process.env.COLORTERM = 'truecolor';

        const capabilities = getTerminalCapabilities();
        expect(capabilities.color).toBe(true);
      } finally {
        (process.stdout as WriteStream).isTTY = originalIsTTY;
        process.env.COLORTERM = originalColorterm;
      }
    });

    test('should detect unicode support correctly', () => {
      const originalLang = process.env.LANG;

      try {
        process.env.LANG = 'en_US.UTF-8';

        const capabilities = getTerminalCapabilities();
        expect(capabilities.unicode).toBe(true);
      } finally {
        process.env.LANG = originalLang;
      }
    });

    test('should detect terminal size correctly', () => {
      const capabilities = getTerminalCapabilities();

      expect(capabilities.width).toBeGreaterThan(0);
      expect(capabilities.height).toBeGreaterThan(0);
      expect(typeof capabilities.isNarrow).toBe('boolean');
      expect(typeof capabilities.isTall).toBe('boolean');
    });
  });

  describe('helper functions', () => {
    test('isColorTerminal should be callable', () => {
      expect(typeof isColorTerminal).toBe('function');
      // Call function but don't test return value in test environment
      isColorTerminal();
    });

    test('isUnicodeTerminal should be callable', () => {
      expect(typeof isUnicodeTerminal).toBe('function');
      // Call function but don't test return value in test environment
      isUnicodeTerminal();
    });
  });
}
