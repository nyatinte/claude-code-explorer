import { z } from 'zod';

// Branded types for type safety
const _ClaudeFilePathBrand = Symbol('ClaudeFilePath');
export type ClaudeFilePath = string & { readonly [_ClaudeFilePathBrand]: true };

// Zod schema for path validation
const _ClaudeFilePathSchema = z
  .string()
  .refine((path) => path.length > 0, { message: 'Path must not be empty' });

export const createClaudeFilePath = (path: string): ClaudeFilePath => {
  _ClaudeFilePathSchema.parse(path); // Validate the path
  return path as ClaudeFilePath;
};

// Safe path creation with validation
export const safeCreateClaudeFilePath = (
  path: string,
): ClaudeFilePath | null => {
  try {
    return createClaudeFilePath(path);
  } catch {
    return null;
  }
};

// Core types as defined in requirement
export type ClaudeFileType =
  | 'claude-md'
  | 'claude-local-md'
  | 'global-md'
  | 'slash-command'
  | 'unknown';

export type ProjectInfo = {
  readonly framework?: string | undefined;
  readonly language?: string | undefined;
  readonly buildCommands?: string[] | undefined;
  readonly testCommands?: string[] | undefined;
  readonly dependencies?: string[] | undefined;
  readonly isIncomplete?: boolean | undefined;
};

type _CommandInfo = {
  readonly name: string;
  readonly description?: string | undefined;
  readonly hasArguments: boolean;
};

export type ClaudeFileInfo = {
  readonly path: ClaudeFilePath;
  readonly type: ClaudeFileType;
  readonly size: number;
  readonly lastModified: Date;
  readonly projectInfo?: ProjectInfo | undefined;
  readonly commands: CommandInfo[];
  readonly tags: string[];
};

export type SlashCommandInfo = {
  readonly name: string;
  readonly scope: 'project' | 'user';
  readonly namespace?: string | undefined;
  readonly description?: string | undefined;
  readonly hasArguments: boolean;
  readonly filePath: ClaudeFilePath;
  readonly lastModified: Date;
};

// Scan options
export type ScanOptions = {
  readonly path?: string | undefined;
  readonly recursive?: boolean | undefined;
  readonly type?: ClaudeFileType | undefined;
  readonly includeHidden?: boolean | undefined;
};

// Output formats
type _OutputFormat = 'table' | 'json';

// CLI command context types
type _ScanCommandArgs = {
  readonly path?: string | undefined;
  readonly recursive?: boolean | undefined;
  readonly type?: ClaudeFileType | undefined;
  readonly output?: OutputFormat | undefined;
};

type _PreviewCommandArgs = {
  readonly filePath?: string | undefined;
  readonly command?: string | undefined;
};

type _CopyCommandArgs = {
  readonly source: string;
  readonly to?: string | undefined;
  readonly clipboard?: boolean | undefined;
  readonly section?: string | undefined;
};

// Zod schemas for validation
const ScanOptionsSchema = z.object({
  path: z.string().optional(),
  recursive: z.boolean().optional(),
  type: z
    .enum([
      'claude-md',
      'claude-local-md',
      'global-md',
      'slash-command',
      'unknown',
    ])
    .optional(),
  includeHidden: z.boolean().optional(),
});

const OutputFormatSchema = z.enum(['table', 'json']);

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('createClaudeFilePath', () => {
    test('should create branded ClaudeFilePath for valid paths', () => {
      const validPaths = [
        '/test/CLAUDE.md',
        '~/CLAUDE.md',
        './src/file.md',
        'file.md',
      ];

      for (const path of validPaths) {
        const claudePath = createClaudeFilePath(path);
        expect(claudePath).toBe(path);
        expect(typeof claudePath).toBe('string');
      }
    });

    test('should throw for invalid paths', () => {
      expect(() => createClaudeFilePath('')).toThrow();
    });
  });

  describe('safeCreateClaudeFilePath', () => {
    test('should return ClaudeFilePath for valid paths', () => {
      const result = safeCreateClaudeFilePath('/valid/path.md');
      expect(result).toBe('/valid/path.md');
    });

    test('should return null for invalid paths', () => {
      const result = safeCreateClaudeFilePath('');
      expect(result).toBeNull();
    });
  });

  describe('ScanOptionsSchema', () => {
    test('should validate valid scan options', () => {
      const validOptions = {
        path: '/test',
        recursive: true,
        type: 'claude-md' as const,
      };
      expect(ScanOptionsSchema.parse(validOptions)).toEqual(validOptions);
    });

    test('should reject invalid type', () => {
      const invalidOptions = {
        type: 'invalid-type',
      };
      expect(() => ScanOptionsSchema.parse(invalidOptions)).toThrow();
    });
  });

  describe('OutputFormatSchema', () => {
    test('should validate table format', () => {
      expect(OutputFormatSchema.parse('table')).toBe('table');
    });

    test('should validate json format', () => {
      expect(OutputFormatSchema.parse('json')).toBe('json');
    });

    test('should reject invalid format', () => {
      expect(() => OutputFormatSchema.parse('xml')).toThrow();
    });
  });
}
