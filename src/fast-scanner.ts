import { fdir } from 'fdir';
import type { ScanOptions } from './_types.ts';
import { DEFAULT_EXCLUSIONS } from './scan-exclusions.ts';

/**
 * Find Claude configuration files using fdir
 * Fast file scanner using fdir (fastest directory crawler for Node.js)
 * Can crawl 1 million files in < 1 second
 */
export const findClaudeFiles = async (
  options: ScanOptions = {},
): Promise<string[]> => {
  const {
    path = process.cwd(),
    recursive = true,
    includeHidden = false,
  } = options;

  let crawler = new fdir()
    .withFullPaths()
    .exclude((dirName) => {
      // Use comprehensive exclusion patterns for security and performance
      if ((DEFAULT_EXCLUSIONS as readonly string[]).includes(dirName)) {
        return true;
      }

      // Handle hidden files
      if (!includeHidden && dirName.startsWith('.') && dirName !== '.claude') {
        return true;
      }

      return false;
    })
    .filter((filePath) => {
      const fileName = filePath.split('/').pop() || '';
      return !!fileName.match(/^CLAUDE\.(md|local\.md)$/);
    });

  // Limit depth for performance
  if (!recursive) {
    crawler = crawler.withMaxDepth(1);
  } else {
    crawler = crawler.withMaxDepth(20); // Reasonable depth limit
  }

  try {
    const files = await crawler.crawl(path).withPromise();
    return files;
  } catch (error) {
    console.warn(`Failed to scan Claude files in ${path}:`, error);
    return [];
  }
};

/**
 * Find slash command files using fdir
 */
export const findSlashCommands = async (
  options: ScanOptions = {},
): Promise<string[]> => {
  const {
    path = process.cwd(),
    recursive = true,
    includeHidden = false,
  } = options;

  let crawler = new fdir()
    .withFullPaths()
    .exclude((dirName) => {
      // Use comprehensive exclusion patterns for security and performance
      if ((DEFAULT_EXCLUSIONS as readonly string[]).includes(dirName)) {
        return true;
      }

      // Handle hidden files
      if (!includeHidden && dirName.startsWith('.') && dirName !== '.claude') {
        return true;
      }

      return false;
    })
    .filter((filePath) => {
      // Look for files in .claude/commands or commands directories
      return (
        (filePath.includes('/.claude/commands/') ||
          filePath.includes('/commands/')) &&
        filePath.endsWith('.md')
      );
    });

  // Limit depth for performance
  if (!recursive) {
    crawler = crawler.withMaxDepth(3); // Commands are usually nested
  } else {
    crawler = crawler.withMaxDepth(20);
  }

  try {
    const files = await crawler.crawl(path).withPromise();
    return files;
  } catch (error) {
    console.warn(`Failed to scan slash commands in ${path}:`, error);
    return [];
  }
};

/**
 * Check if fdir is available (always true since it's a dependency)
 * Internal function for testing only
 */
const isAvailable = async (): Promise<boolean> => {
  return true;
};

/**
 * Get fdir version information
 * Internal function for testing only
 */
const getVersion = async (): Promise<string> => {
  try {
    // Get version from package.json
    const pkg = await import('fdir/package.json');
    return `fdir ${pkg.version}`;
  } catch {
    return 'fdir (version unknown)';
  }
};

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('fast-scanner', () => {
    test('should be available after installation', async () => {
      const available = await isAvailable();
      expect(available).toBe(true);
    });

    test('should return version information', async () => {
      const version = await getVersion();
      expect(version).toMatch(/fdir/);
    });

    test('should find CLAUDE.md files', async () => {
      const files = await findClaudeFiles({
        path: process.cwd(),
        recursive: false,
      });

      expect(Array.isArray(files)).toBe(true);
      // Should find at least the project's CLAUDE.md
      expect(files.some((file: string) => file.endsWith('CLAUDE.md'))).toBe(
        true,
      );
    });

    test('should respect recursive option', async () => {
      const nonRecursive = await findClaudeFiles({
        path: process.cwd(),
        recursive: false,
      });

      const recursive = await findClaudeFiles({
        path: process.cwd(),
        recursive: true,
      });

      // Recursive should find same or more files
      expect(recursive.length >= nonRecursive.length).toBe(true);
    });

    test('should find slash command files', async () => {
      // Create a test fixture with fs-fixture if needed
      const commands = await findSlashCommands({
        path: process.cwd(),
        recursive: true,
      });

      expect(Array.isArray(commands)).toBe(true);
      // Commands array might be empty if no .claude/commands exist
    });

    test('should handle non-existent paths gracefully', async () => {
      const files = await findClaudeFiles({
        path: '/non/existent/path',
        recursive: false,
      });

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(0);
    });
  });
}
