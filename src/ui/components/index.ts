export {
  createClaudeFileDescription,
  createClaudeFileLabel,
  createSlashCommandDescription,
  createSlashCommandLabel,
} from './file-display.ts';

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('components index', () => {
    test('should export display functions', async () => {
      const {
        createClaudeFileLabel,
        createClaudeFileDescription,
        createSlashCommandLabel,
        createSlashCommandDescription,
      } = await import('./file-display.ts');
      expect(typeof createClaudeFileLabel).toBe('function');
      expect(typeof createClaudeFileDescription).toBe('function');
      expect(typeof createSlashCommandLabel).toBe('function');
      expect(typeof createSlashCommandDescription).toBe('function');
    });
  });
}
