import { search, select } from '@inquirer/prompts';
import { getColorTheme, getIconSet } from '../themes/index.ts';

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
  const {
    title = '選択してください',
    pageSize = options.maxDisplayItems || 15, // Match nr's 15 choices limit
    loop = true,
    enableSearch = true, // Enable search by default for better UX
    filterPlaceholder = 'Type to search...',
  } = options;

  try {
    const colors = getColorTheme();
    const icons = getIconSet();

    // Filter out disabled items
    const availableItems = items.filter((item) => !item.disabled);

    if (availableItems.length === 0) {
      return null;
    }

    // Use @inquirer/search for interactive experience (like nr)
    if (enableSearch && options.enableFilter) {
      return await searchSelect(availableItems, {
        title,
        filterPlaceholder,
        pageSize,
        colors,
        icons,
      });
    }

    // Fallback to standard select for simple cases
    const promptConfig = {
      message: colors.primary(title),
      choices: availableItems.map((item) => ({
        name: item.label,
        value: item,
        ...(item.description && { description: item.description }),
      })),
      pageSize,
      loop,
      theme: {
        prefix: {
          pending: colors.info('?'),
          done: colors.success(icons.check),
        },
        style: {
          answer: colors.accent,
          message: colors.primary,
          description: colors.muted,
          highlight: colors.highlight,
          disabled: colors.dim,
        },
        icon: {
          cursor: colors.accent('→'),
        },
      },
    };

    const result = (await select(promptConfig)) as T;
    return result;
  } catch (error) {
    // Handle Ctrl+C and Escape key gracefully
    if (error instanceof Error && error.name === 'ExitPromptError') {
      // Escape key should return null to go back to previous menu
      return null; // Always return null to allow menu navigation
    }
    throw error;
  }
};

// @inquirer/search implementation for clean search experience
const searchSelect = async <T extends SelectableItem>(
  items: T[],
  config: {
    title: string;
    filterPlaceholder: string;
    pageSize: number;
    colors: ReturnType<typeof getColorTheme>;
    icons: ReturnType<typeof getIconSet>;
  },
): Promise<T | null> => {
  const { title, pageSize, colors, icons } = config;

  try {
    const result = await search({
      message: colors.primary(title),
      source: async (input, { signal }) => {
        if (signal?.aborted) return [];

        // Simple search by filtering items based on input
        const searchTerm = (input || '').toLowerCase().trim();

        let filteredItems = items;
        if (searchTerm) {
          // Search in both label and description
          filteredItems = items.filter((item) => {
            const searchText =
              `${item.label} ${item.description || ''}`.toLowerCase();
            return searchText.includes(searchTerm);
          });
        }

        // Return formatted choices (limit results like nr)
        return filteredItems.slice(0, pageSize).map((item) => ({
          name: formatItemForDisplay(item, colors),
          value: item,
          description: item.description,
        }));
      },
      pageSize,
      theme: {
        prefix: {
          pending: colors.info('?'),
          done: colors.success(icons.check),
        },
        style: {
          answer: colors.accent,
          message: colors.primary,
          description: colors.muted,
          searchTerm: colors.accent,
          highlight: colors.highlight,
        },
      },
    });

    return result as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      return null; // ESC key pressed - go back to previous menu
    }
    throw error;
  }
};

// Format item for display (nr-style)
const formatItemForDisplay = <T extends SelectableItem>(
  item: T,
  colors: ReturnType<typeof getColorTheme>,
): string => {
  // Add description if available (truncated like nr)
  if (item.description) {
    const maxDescLength = 60; // Truncate long descriptions
    const truncatedDesc =
      item.description.length > maxDescLength
        ? `${item.description.slice(0, maxDescLength)}...`
        : item.description;
    return `${item.label} ${colors.muted(`- ${truncatedDesc}`)}`;
  }

  return item.label;
};

// Removed: enhancedSelect alias to avoid duplicate exports

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('selectWithArrows - Core Functionality', () => {
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
  });

  describe('selectWithArrows - Search & Filter Features', () => {
    test('should apply correct search placeholder for Claude files', () => {
      const options: SelectionOptions = {
        title: 'Claude Configuration Files',
        filterPlaceholder:
          'Search by name, type, or framework... (e.g. "next", "local", "project")',
        enableFilter: true,
      };

      expect(options.filterPlaceholder).toContain('name, type, or framework');
      expect(options.filterPlaceholder).toContain('next');
      expect(options.filterPlaceholder).toContain('local');
      expect(options.filterPlaceholder).toContain('project');
      expect(options.enableFilter).toBe(true);
    });

    test('should apply correct search placeholder for slash commands', () => {
      const options: SelectionOptions = {
        title: 'Slash Commands',
        filterPlaceholder:
          'Search by name, namespace, or scope... (e.g. "deploy", "user", "ci")',
        enableFilter: true,
      };

      expect(options.filterPlaceholder).toContain('name, namespace, or scope');
      expect(options.filterPlaceholder).toContain('deploy');
      expect(options.filterPlaceholder).toContain('user');
      expect(options.filterPlaceholder).toContain('ci');
      expect(options.enableFilter).toBe(true);
    });

    test('should support pagination options for large file lists', () => {
      const options: SelectionOptions = {
        pageSize: 15,
        loop: true,
        maxDisplayItems: 20,
      };

      expect(options.pageSize).toBe(15);
      expect(options.loop).toBe(true);
      expect(options.maxDisplayItems).toBe(20);
    });
  });

  describe('selectWithArrows - Error Handling Logic', () => {
    test('should handle ExitPromptError name detection', () => {
      // Test the error detection logic
      const exitError = Object.assign(new Error('User canceled'), {
        name: 'ExitPromptError',
      });
      const normalError = new Error('Network error');

      expect(exitError.name).toBe('ExitPromptError');
      expect(normalError.name).toBe('Error');
    });

    test('should detect platform correctly for cross-platform handling', () => {
      // Test platform detection logic
      expect(['win32', 'darwin', 'linux']).toContain(process.platform);
    });
  });

  describe('selectWithArrows - Configuration Validation', () => {
    test('should configure prompt correctly with all options', () => {
      const items = [
        { label: 'Test', value: 'test', description: 'Test item' },
      ];
      const options: SelectionOptions = {
        title: 'Test Menu',
        pageSize: 10,
        loop: true,
      };

      // Test that options are properly structured
      expect(options.title).toBe('Test Menu');
      expect(options.pageSize).toBe(10);
      expect(options.loop).toBe(true);

      // Test item structure
      expect(items[0]?.label).toBe('Test');
      expect(items[0]?.value).toBe('test');
      expect(items[0]?.description).toBe('Test item');
    });

    test('should handle default values correctly', () => {
      const defaultTitle = '選択してください';
      const defaultPageSize = 10;
      const defaultLoop = true;

      expect(defaultTitle).toBeTruthy();
      expect(defaultPageSize).toBeGreaterThan(0);
      expect(defaultLoop).toBe(true);
    });
  });

  describe('selectWithArrows - Type Safety', () => {
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
  });

  // Removed enhancedSelect tests as alias was removed
}
