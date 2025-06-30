// Shared CLI argument definitions for gunshi commands
export const sharedArgs = {
  path: {
    type: 'string' as const,
    short: 'p',
    description: 'Path to search for Claude files',
  },
  recursive: {
    type: 'boolean' as const,
    short: 'r',
    description: 'Search recursively in subdirectories',
  },
  output: {
    type: 'string' as const,
    short: 'o',
    description: 'Output format (table|json)',
  },
  type: {
    type: 'string' as const,
    short: 't',
    description:
      'File type filter (claude-md|claude-local-md|global-md|slash-command)',
  },
  verbose: {
    type: 'boolean' as const,
    short: 'v',
    description: 'Enable verbose output',
  },
} as const;

// Command-specific argument sets
export const scanArgs = {
  ...sharedArgs,
  includeHidden: {
    type: 'boolean' as const,
    short: 'h',
    description: 'Include hidden files and directories',
  },
} as const;

export const copyArgs = {
  source: {
    type: 'string' as const,
    short: 's',
    description: 'Source file path to copy',
    required: true,
  },
  to: {
    type: 'string' as const,
    description: 'Destination path for copying',
  },
  clipboard: {
    type: 'boolean' as const,
    short: 'c',
    description: 'Copy to clipboard instead of file',
  },
  section: {
    type: 'string' as const,
    description: 'Copy specific section only',
  },
} as const;

export const previewArgs = {
  filePath: {
    type: 'string' as const,
    short: 'f',
    description: 'File path to preview',
  },
  command: {
    type: 'string' as const,
    short: 'c',
    description: 'Slash command name to preview',
  },
  lines: {
    type: 'number' as const,
    short: 'l',
    description: 'Number of lines to show',
    default: 50,
  },
} as const;

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('sharedArgs', () => {
    test('should define common CLI arguments', () => {
      expect(sharedArgs.path.type).toBe('string');
      expect(sharedArgs.path.short).toBe('p');
      expect(sharedArgs.recursive.type).toBe('boolean');
      expect(sharedArgs.recursive.short).toBe('r');
    });

    test('should have proper descriptions', () => {
      expect(sharedArgs.path.description).toContain('Path to search');
      expect(sharedArgs.recursive.description).toContain('recursively');
      expect(sharedArgs.output.description).toContain('Output format');
    });
  });

  describe('scanArgs', () => {
    test('should include shared args and scan-specific args', () => {
      expect(scanArgs.path).toBe(sharedArgs.path);
      expect(scanArgs.includeHidden.type).toBe('boolean');
      expect(scanArgs.includeHidden.short).toBe('h');
    });
  });

  describe('copyArgs', () => {
    test('should have required source argument', () => {
      expect(copyArgs.source.required).toBe(true);
      expect(copyArgs.source.type).toBe('string');
      expect(copyArgs.source.short).toBe('s');
    });

    test('should have optional destination and clipboard options', () => {
      expect(copyArgs.to.type).toBe('string');
      expect(copyArgs.clipboard.type).toBe('boolean');
      expect(copyArgs.section.type).toBe('string');
    });
  });

  describe('previewArgs', () => {
    test('should have file path and command options', () => {
      expect(previewArgs.filePath.type).toBe('string');
      expect(previewArgs.command.type).toBe('string');
    });

    test('should have default lines value', () => {
      expect(previewArgs.lines.default).toBe(50);
      expect(previewArgs.lines.type).toBe('number');
    });
  });
}
