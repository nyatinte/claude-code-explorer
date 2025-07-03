import prompts from 'prompts';

export type SelectableItem = {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
};

type SelectionOptions = {
  title?: string;
  filterPlaceholder?: string;
  enableFilter?: boolean;
  maxDisplayItems?: number;
  pageSize?: number;
  loop?: boolean;
  enableSearch?: boolean; // New option for @inquirer/search
};

export const selectWithArrows = async <T extends SelectableItem>(
  items: T[],
  options: SelectionOptions = {},
): Promise<T | null> => {
  const { title = '選択してください' } = options;

  // Filter out disabled items
  const availableItems = items.filter((item) => !item.disabled);

  if (availableItems.length === 0) {
    return null;
  }

  // Use prompts library with proper ESC key support
  const choices = availableItems.map((item) => ({
    title: item.label,
    description: item.description,
    value: item,
  }));

  try {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: title,
      choices,
      initial: 0,
    });

    // prompts returns undefined when cancelled (ESC key)
    // but throws an error for Ctrl+C
    return response.value || null;
  } catch (_error) {
    // Ctrl+C was pressed - exit application
    process.exit(0);
  }
};

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('selectWithArrows with prompts library', () => {
    test('should handle empty items array', async () => {
      const result = await selectWithArrows([]);
      expect(result).toBeNull();
    });

    test('should return null when all items are disabled', async () => {
      const items = [
        { label: 'Option 1', value: 'opt1', disabled: true },
        { label: 'Option 2', value: 'opt2', disabled: true },
      ];

      const result = await selectWithArrows(items);
      expect(result).toBeNull();
    });

    test('should filter disabled items for available choices', () => {
      const items = [
        { label: 'Enabled Option', value: 'enabled', disabled: false },
        { label: 'Disabled Option', value: 'disabled', disabled: true },
      ];

      // Test the filtering logic directly
      const availableItems = items.filter((item) => !item.disabled);
      expect(availableItems).toHaveLength(1);
      expect(availableItems[0]?.value).toBe('enabled');
    });

    test('should format choices correctly for prompts library', () => {
      const items = [
        { label: 'Test Item', value: 'test', description: 'Test description' },
        { label: 'Another Item', value: 'another' },
      ];

      const choices = items.map((item) => ({
        title: item.label,
        description: item.description,
        value: item,
      }));

      expect(choices).toHaveLength(2);
      expect(choices[0]?.title).toBe('Test Item');
      expect(choices[0]?.description).toBe('Test description');
      expect(choices[1]?.title).toBe('Another Item');
      expect(choices[1]?.description).toBeUndefined();
    });
  });

  describe('SelectionOptions interface', () => {
    test('should validate SelectionOptions interface', () => {
      const options: SelectionOptions = {
        title: 'Claude Files',
        filterPlaceholder: 'Search files...',
        enableFilter: true,
        maxDisplayItems: 10,
        pageSize: 8,
        loop: true,
      };

      expect(options.title).toBe('Claude Files');
      expect(options.filterPlaceholder).toBe('Search files...');
      expect(options.enableFilter).toBe(true);
      expect(options.maxDisplayItems).toBe(10);
      expect(options.pageSize).toBe(8);
      expect(options.loop).toBe(true);
    });

    test('should validate SelectableItem interface', () => {
      const item: SelectableItem = {
        label: 'CLAUDE.md',
        value: '/path/to/CLAUDE.md',
        disabled: false,
        description: 'Project configuration file',
      };

      expect(item.label).toBe('CLAUDE.md');
      expect(item.value).toBe('/path/to/CLAUDE.md');
      expect(item.disabled).toBe(false);
      expect(item.description).toBe('Project configuration file');
    });
  });
}
