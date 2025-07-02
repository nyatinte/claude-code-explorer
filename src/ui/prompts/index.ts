import { type SelectableItem, selectWithArrows } from './enhanced-select.ts';

// Re-export only used exports
export { type SelectableItem, selectWithArrows };

// Future exports can be added here
// export { multiSelect } from './multi-select.ts';
// export { searchPrompt } from './search.ts';

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('prompts index', () => {
    test('should export selectWithArrows', async () => {
      const { selectWithArrows } = await import('./enhanced-select.ts');
      expect(typeof selectWithArrows).toBe('function');
    });

    test('should export types', () => {
      // Types are only available at compile time, so we test their usage
      const item: SelectableItem = {
        label: 'Test',
        value: 'test',
      };
      expect(item.label).toBe('Test');
    });
  });
}
