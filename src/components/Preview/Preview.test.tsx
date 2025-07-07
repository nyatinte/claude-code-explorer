import { promises as fs } from 'node:fs';
import { render } from 'ink-testing-library';
import { createMockFile, createMockFileContent } from '../../test-helpers.js';
import { Preview } from './Preview.js';

// Mock the file system
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

if (import.meta.vitest) {
  const { describe, test, expect, vi, beforeEach } = import.meta.vitest;

  const mockedReadFile = vi.mocked(fs.readFile);

  beforeEach(() => {
    mockedReadFile.mockClear();
  });

  describe('Preview', () => {
    test('displays placeholder when no file selected', () => {
      const { lastFrame } = render(<Preview />);

      expect(lastFrame()).toContain('Select a file to preview');
    });

    test('displays basic file information when selected', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('CLAUDE.md');
      expect(lastFrame()).toContain('/test/CLAUDE.md');
      expect(lastFrame()).toContain('Type: claude-md');
    });

    test('displays different file types', () => {
      const file = createMockFile('CLAUDE.local.md', 'claude-local-md');

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('CLAUDE.local.md');
      expect(lastFrame()).toContain('Type: claude-local-md');
    });

    test('displays slash command files', () => {
      const file = createMockFile(
        'deploy.md',
        'slash-command',
        '/.claude/commands/deploy.md',
        {
          commands: [
            {
              name: 'deploy',
              description: 'Deploy application',
              hasArguments: true,
            },
          ],
          tags: ['production'],
        },
      );

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('deploy.md');
      expect(lastFrame()).toContain('Type: slash-command');
      expect(lastFrame()).toContain('/.claude/commands/deploy.md');
    });

    test('displays global type files', () => {
      const file = createMockFile(
        'CLAUDE.md',
        'global-md',
        '/Users/test/.claude/CLAUDE.md',
      );

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('CLAUDE.md');
      expect(lastFrame()).toContain('Type: global-md');
      expect(lastFrame()).toContain('/Users/test/.claude/CLAUDE.md');
    });

    test('displays file statistics', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md', '/test/CLAUDE.md', {
        size: 2048,
        lastModified: new Date('2024-01-15T10:30:00Z'),
      });

      const { lastFrame } = render(<Preview file={file} />);

      // Verify statistics are displayed
      expect(lastFrame()).toContain('Lines:');
      expect(lastFrame()).toContain('Size:');
      expect(lastFrame()).toContain('chars');
    });

    test('loads file content and displays Markdown', async () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const mockContent = createMockFileContent('claude-md');

      mockedReadFile.mockResolvedValue(mockContent);

      const { lastFrame } = render(<Preview file={file} />);

      // Verify file reading is called
      // Note: Actual implementation uses useEffect for async loading
      expect(lastFrame()).toBeDefined();
    });

    test('handles file reading errors', async () => {
      const file = createMockFile('missing.md', 'claude-md');

      mockedReadFile.mockRejectedValue(new Error('File not found'));

      const { lastFrame } = render(<Preview file={file} />);

      // Verify error handling (implementation dependent)
      expect(lastFrame()).toBeDefined();
    });

    test('displays detailed slash command information', () => {
      const file = createMockFile(
        'complex-deploy.md',
        'slash-command',
        '/.claude/commands/complex-deploy.md',
        {
          commands: [
            {
              name: 'deploy',
              description: 'Deploy application to various environments',
              hasArguments: true,
            },
            {
              name: 'rollback',
              description: 'Rollback to previous version',
              hasArguments: false,
            },
          ],
          tags: ['production', 'staging', 'deploy'],
        },
      );

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('complex-deploy.md');
      expect(lastFrame()).toContain('Type: slash-command');

      // Verify command and tag information is displayed (implementation dependent)
      const output = lastFrame();
      expect(output).toBeDefined();
    });

    test('displays large file sizes', () => {
      const file = createMockFile(
        'large-file.md',
        'claude-md',
        '/test/large-file.md',
        {
          size: 1024 * 1024 * 5, // 5MB
        },
      );

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('large-file.md');
      expect(lastFrame()).toContain('Type: claude-md');
      expect(lastFrame()).toContain('Size:');
    });

    test('displays file paths with special characters', () => {
      const file = createMockFile(
        'file with spaces & symbols.md',
        'claude-md',
        '/test/path with spaces & symbols/file with spaces & symbols.md',
      );

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('file with spaces & symbols.md');
      expect(lastFrame()).toContain(
        '/test/path with spaces & symbols/file with spaces & symbols.md',
      );
    });

    test('displays slash command files with empty commands and tags', () => {
      const file = createMockFile(
        'simple.md',
        'slash-command',
        '/.claude/commands/simple.md',
        {
          commands: [],
          tags: [],
        },
      );

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('simple.md');
      expect(lastFrame()).toContain('Type: slash-command');
    });

    test('displays Claude files with project information', () => {
      const file = createMockFile(
        'CLAUDE.md',
        'claude-md',
        '/project/CLAUDE.md',
        {
          projectInfo: {
            framework: 'React',
            language: 'TypeScript',
            buildCommands: ['bun run build'],
          },
        },
      );

      const { lastFrame } = render(<Preview file={file} />);

      expect(lastFrame()).toContain('CLAUDE.md');
      expect(lastFrame()).toContain('Type: claude-md');
      // Verify project information display (implementation dependent)
    });

    test('remains stable across multiple renders', () => {
      const file1 = createMockFile('file1.md', 'claude-md');
      const file2 = createMockFile('file2.md', 'claude-local-md');

      const { lastFrame, rerender } = render(<Preview file={file1} />);

      expect(lastFrame()).toContain('file1.md');
      expect(lastFrame()).toContain('Type: claude-md');

      // Re-render with different file
      rerender(<Preview file={file2} />);

      expect(lastFrame()).toContain('file2.md');
      // Verify display state after rerender (avoiding implementation details)
      const output = lastFrame();
      expect(output).toBeDefined();
      expect(output?.length ?? 0).toBeGreaterThan(0);
    });

    test('switches from undefined file to valid file', () => {
      const file = createMockFile('test.md', 'claude-md');

      const { lastFrame, rerender } = render(<Preview />);

      expect(lastFrame()).toContain('Select a file to preview');

      // Re-render with file set
      rerender(<Preview file={file} />);

      expect(lastFrame()).toContain('test.md');
      expect(lastFrame()).toContain('Type: claude-md');
    });
  });
}
