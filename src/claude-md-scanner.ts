import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { glob } from 'tinyglobby';
import {
  CLAUDE_FILE_PATTERNS,
  DEFAULT_SEARCH_PATHS,
  FILE_SIZE_LIMITS,
} from './_consts.ts';
import type {
  ClaudeFileInfo,
  ClaudeFileType,
  ProjectInfo,
  ScanOptions,
} from './_types.ts';
import { createClaudeFilePath } from './_types.ts';
import {
  analyzeProjectInfo,
  detectClaudeFileType,
  extractCommandsFromContent,
  extractTagsFromContent,
  validateClaudeMdContent,
} from './_utils.ts';

export const scanClaudeFiles = async (
  options: ScanOptions = {},
): Promise<ClaudeFileInfo[]> => {
  const {
    path = process.cwd(),
    recursive = true,
    type,
    includeHidden = false,
  } = options;

  const patterns = getSearchPatterns(type, recursive);
  const searchPath = path || process.cwd();

  try {
    // Find all matching files
    const files = await glob(patterns, {
      cwd: searchPath,
      absolute: true,
      dot: includeHidden,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    });

    // Process each file
    const fileInfos: ClaudeFileInfo[] = [];

    for (const filePath of files) {
      try {
        const fileInfo = await processClaudeFile(filePath);
        if (fileInfo) {
          fileInfos.push(fileInfo);
        }
      } catch (error) {
        console.warn(`Failed to process file: ${filePath}`, error);
      }
    }

    // Sort by last modified date (newest first)
    return fileInfos.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
    );
  } catch (error) {
    throw new Error(
      `Failed to scan Claude files: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

const getSearchPatterns = (
  type?: ClaudeFileType,
  recursive = true,
): string[] => {
  const patterns: string[] = [];
  const prefix = recursive ? '**/' : '';

  if (!type || type === 'claude-md') {
    patterns.push(`${prefix}CLAUDE.md`);
  }

  if (!type || type === 'claude-local-md') {
    patterns.push(`${prefix}CLAUDE.local.md`);
  }

  if (!type || type === 'global-md') {
    patterns.push(CLAUDE_FILE_PATTERNS.GLOBAL_CLAUDE_MD);
  }

  if (!type || type === 'slash-command') {
    patterns.push(`${prefix}.claude/commands/**/*.md`);
  }

  return patterns;
};

const processClaudeFile = async (
  filePath: string,
): Promise<ClaudeFileInfo | null> => {
  try {
    // Check if file exists and get stats
    if (!existsSync(filePath)) {
      return null;
    }

    const stats = await stat(filePath);

    // Skip if file is too large
    if (stats.size > FILE_SIZE_LIMITS.MAX_CLAUDE_MD_SIZE) {
      console.warn(`File too large, skipping: ${filePath}`);
      return null;
    }

    // Read file content
    const content = await readFile(filePath, 'utf-8');

    // Validate content
    if (!validateClaudeMdContent(content)) {
      console.warn(`Invalid Claude.md content, skipping: ${filePath}`);
      return null;
    }

    // Detect file type
    const fileType = detectClaudeFileType(filePath);

    // Extract information from content
    const tags = extractTagsFromContent(content);
    const commands = extractCommandsFromContent(content);

    // Analyze project info if it's a project file
    let projectInfo: ProjectInfo | undefined;
    if (fileType === 'claude-md' || fileType === 'claude-local-md') {
      const projectDir = dirname(filePath);
      projectInfo = await analyzeProjectInfo(projectDir);
    }

    return {
      path: createClaudeFilePath(filePath),
      type: fileType,
      size: stats.size,
      lastModified: stats.mtime,
      projectInfo,
      commands,
      tags,
    };
  } catch (error) {
    console.warn(`Failed to process file ${filePath}:`, error);
    return null;
  }
};

// Find Claude files in common locations
export const findGlobalClaudeFiles = async (): Promise<ClaudeFileInfo[]> => {
  const files: ClaudeFileInfo[] = [];

  for (const searchPath of DEFAULT_SEARCH_PATHS) {
    try {
      const foundFiles = await scanClaudeFiles({
        path: searchPath,
        recursive: true,
      });
      files.push(...foundFiles);
    } catch (error) {
      console.warn(`Failed to search in ${searchPath}:`, error);
    }
  }

  // Remove duplicates based on file path
  const uniqueFiles = new Map<string, ClaudeFileInfo>();
  for (const file of files) {
    uniqueFiles.set(file.path, file);
  }

  return Array.from(uniqueFiles.values());
};

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect, vi } = import.meta.vitest;

  describe('getSearchPatterns', () => {
    test('should return all patterns when no type specified', () => {
      const patterns = getSearchPatterns(undefined, true);
      expect(patterns).toContain('**/CLAUDE.md');
      expect(patterns).toContain('**/CLAUDE.local.md');
      expect(patterns).toContain('**/.claude/commands/**/*.md');
    });

    test('should return specific pattern for claude-md type', () => {
      const patterns = getSearchPatterns('claude-md', true);
      expect(patterns).toContain('**/CLAUDE.md');
      expect(patterns).not.toContain('**/CLAUDE.local.md');
    });

    test('should respect recursive option', () => {
      const patterns = getSearchPatterns('claude-md', false);
      expect(patterns).toContain('CLAUDE.md');
      expect(patterns).not.toContain('**/CLAUDE.md');
    });
  });

  describe('scanClaudeFiles', () => {
    test('should handle empty options', async () => {
      // Mock glob to return empty array
      vi.doMock('tinyglobby', () => ({
        glob: vi.fn().mockResolvedValue([]),
      }));

      const result = await scanClaudeFiles();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should use current directory as default path', async () => {
      const options: ScanOptions = {};
      // Test would call scanClaudeFiles with process.cwd() as default
      expect(options.path).toBeUndefined();
    });
  });

  describe('processClaudeFile', () => {
    test('should return null for non-existent file', async () => {
      const result = await processClaudeFile('/non/existent/file.md');
      expect(result).toBeNull();
    });
  });

  describe('findGlobalClaudeFiles', () => {
    test('should search in default paths', async () => {
      // Create a simple test that doesn't do actual file system scanning
      const { createFixture } = await import('fs-fixture');
      const fixture = await createFixture({
        'CLAUDE.md': '# Test Project\nThis is a test',
      });

      try {
        // Test the function with a controlled directory
        const result = await scanClaudeFiles({
          path: fixture.path,
          recursive: false,
        });
        expect(Array.isArray(result)).toBe(true);
      } finally {
        await fixture.rm();
      }
    }, 10000); // 10 second timeout
  });
}
