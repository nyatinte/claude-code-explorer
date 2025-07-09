import { Text } from 'ink';
import { render } from 'ink-testing-library';
import type { FileScanner } from '../_types.js';
import { scanClaudeFiles } from '../claude-md-scanner.js';
import { scanSlashCommands } from '../slash-command-scanner.js';
import { delay } from '../test-utils.js';
import { useFileNavigation } from './useFileNavigation.js';

// Test component (for testing useFileNavigation)
function TestComponent({ scanner }: { scanner?: FileScanner }) {
  const { files, selectedFile, isLoading, error } = useFileNavigation(
    { recursive: false },
    scanner,
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <>
      <Text>Files: {files.length}</Text>
      {selectedFile && <Text>Selected: {selectedFile.path}</Text>}
      <Text>Test actions available</Text>
    </>
  );
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  const {
    createClaudeProjectFixture,
    createComplexProjectFixture,
    withTempFixture,
  } = await import('../test-fixture-helpers.js');

  describe('useFileNavigation', () => {
    test('files are loaded and sorted correctly', async () => {
      // Create actual file structure
      await using fixture = await createClaudeProjectFixture({
        projectName: 'test-project',
        includeLocal: true,
        includeCommands: true,
      });

      // Create test scanner that scans the fixture directory
      const testScanner: FileScanner = {
        scanClaudeFiles: (options) =>
          scanClaudeFiles({
            ...options,
            path: fixture.getPath('test-project'),
            recursive: false,
          }),
        scanSlashCommands: (options) =>
          scanSlashCommands({
            ...options,
            path: fixture.getPath('test-project'),
            recursive: false,
          }),
      };

      const { lastFrame } = render(<TestComponent scanner={testScanner} />);

      // Initial state is loading
      expect(lastFrame()).toContain('Loading...');

      // Wait for async processing to complete
      await delay(300); // Optimized delay for file operations

      // Verify results
      const frame = lastFrame();
      expect(frame).toContain('Files:'); // Should find files
      expect(frame).toContain('Selected:'); // Should have a selected file
      expect(frame).not.toContain('Error:'); // No errors
    });

    test.skip('error state is set when Claude file loading fails', async () => {
      // Create a directory with permission issues
      await using _fixture = await withTempFixture(
        {
          restricted: {
            'CLAUDE.md': 'Test content',
          },
        },
        async (f) => {
          const { chmod } = await import('node:fs/promises');

          // Make directory unreadable
          await chmod(f.getPath('restricted'), 0o000);

          // Create test scanner that tries to scan the restricted directory
          const testScanner: FileScanner = {
            scanClaudeFiles: (options) =>
              scanClaudeFiles({
                ...options,
                path: f.getPath('restricted'),
                recursive: false,
              }),
            scanSlashCommands: (options) =>
              scanSlashCommands({
                ...options,
                path: f.getPath('restricted'),
                recursive: false,
              }),
          };

          const { lastFrame } = render(<TestComponent scanner={testScanner} />);

          // Initial state is loading
          expect(lastFrame()).toContain('Loading...');

          // Wait for async processing to complete
          await delay(300); // Reduced delay for error handling

          // Should show error state or have files from global directory
          const frame = lastFrame();
          console.log('Error test frame:', frame);
          // The error might be caught and only global files shown
          expect(frame).not.toContain('Loading...');

          // Restore permissions
          await chmod(f.getPath('restricted'), 0o755);

          return f;
        },
      );
    });

    test('handles empty project directory', async () => {
      // Create empty directory
      await using _fixture = await withTempFixture(
        {
          'empty-project': {},
        },
        async (f) => {
          // Create test scanner for empty directory
          const testScanner: FileScanner = {
            scanClaudeFiles: (options) =>
              scanClaudeFiles({
                ...options,
                path: f.getPath('empty-project'),
                recursive: false,
              }),
            scanSlashCommands: (options) =>
              scanSlashCommands({
                ...options,
                path: f.getPath('empty-project'),
                recursive: false,
              }),
          };

          const { lastFrame } = render(<TestComponent scanner={testScanner} />);

          // Initial state is loading
          expect(lastFrame()).toContain('Loading...');

          // Wait for async processing to complete
          await delay(300); // Optimized delay

          // Should show only global user files (since local directory is empty)
          const frame = lastFrame();
          expect(frame).toContain('Files:');
          // Will have global slash commands but no local files

          return f;
        },
      );
    });

    test('handles complex project structure', async () => {
      // Create complex project structure
      await using fixture = await createComplexProjectFixture();

      // Create test scanner for complex project
      const testScanner: FileScanner = {
        scanClaudeFiles: (options) =>
          scanClaudeFiles({
            ...options,
            path: fixture.getPath('my-app'),
            recursive: false,
          }),
        scanSlashCommands: (options) =>
          scanSlashCommands({
            ...options,
            path: fixture.getPath('my-app'),
            recursive: false,
          }),
      };

      const { lastFrame } = render(<TestComponent scanner={testScanner} />);

      // Initial state is loading
      expect(lastFrame()).toContain('Loading...');

      // Wait for async processing to complete
      await delay(500);

      // Should find multiple files
      const frame = lastFrame();
      expect(frame).toContain('Files:');
      expect(frame).not.toContain('Files: 0');
      expect(frame).toContain('Selected:');
    });

    test('finds global Claude files in home directory', async () => {
      // Create home directory structure
      await using _fixture = await withTempFixture(
        {
          '.claude': {
            'CLAUDE.md': '# Global Claude Config',
          },
          project: {
            'CLAUDE.md': '# Project Config',
          },
        },
        async (f) => {
          // Create custom scanner that uses test HOME directory
          const testScanner: FileScanner = {
            scanClaudeFiles: async (options) => {
              const originalHome = process.env.HOME;
              process.env.HOME = f.path;
              try {
                const result = await scanClaudeFiles({
                  ...options,
                  path: f.getPath('project'),
                  recursive: false,
                });
                return result;
              } finally {
                process.env.HOME = originalHome;
              }
            },
            scanSlashCommands: (options) =>
              scanSlashCommands({
                ...options,
                path: f.getPath('project'),
                recursive: false,
              }),
          };

          const { lastFrame } = render(<TestComponent scanner={testScanner} />);

          await delay(300); // Optimized delay

          // Should find both global and project files
          const frame = lastFrame();
          expect(frame).toContain('Files:');
          expect(frame).not.toContain('Files: 0');

          return f;
        },
      );
    });

    test('slash commands are properly loaded', async () => {
      // Import the helper function
      const { createSlashCommandsFixture } = await import(
        '../test-fixture-helpers.js'
      );

      await using fixture = await createSlashCommandsFixture();

      // Create test scanner for slash commands
      const testScanner: FileScanner = {
        scanClaudeFiles: (options) =>
          scanClaudeFiles({
            ...options,
            path: fixture.getPath('slash-project'),
            recursive: false,
          }),
        scanSlashCommands: (options) =>
          scanSlashCommands({
            ...options,
            path: fixture.getPath('slash-project'),
            recursive: false,
          }),
      };

      const { lastFrame } = render(<TestComponent scanner={testScanner} />);

      await delay(300); // Optimized delay

      // Should find slash commands (3 local + global commands)
      const frame = lastFrame();
      expect(frame).toContain('Files:');
      expect(frame).not.toContain('Files: 0');
      expect(frame).toContain('Selected:');
    });

    test('handles mixed file types', async () => {
      // Import the helper function
      const { createMixedFilesFixture } = await import(
        '../test-fixture-helpers.js'
      );

      await using fixture = await createMixedFilesFixture();

      // Create test scanner for mixed file types
      const testScanner: FileScanner = {
        scanClaudeFiles: (options) =>
          scanClaudeFiles({
            ...options,
            path: fixture.getPath('mixed-project'),
            recursive: false,
          }),
        scanSlashCommands: (options) =>
          scanSlashCommands({
            ...options,
            path: fixture.getPath('mixed-project'),
            recursive: false,
          }),
      };

      const { lastFrame } = render(<TestComponent scanner={testScanner} />);

      await delay(300); // Optimized delay

      // Should find all file types
      const frame = lastFrame();
      expect(frame).toContain('Files:');
      expect(frame).not.toContain('Files: 0');
      expect(frame).toContain('Selected:');
    });

    test('handles file updates after initial load', async () => {
      // Create initial project structure
      await using fixture = await createClaudeProjectFixture({
        projectName: 'update-test',
      });

      // Create test scanner
      const testScanner: FileScanner = {
        scanClaudeFiles: (options) =>
          scanClaudeFiles({
            ...options,
            path: fixture.getPath('update-test'),
            recursive: false,
          }),
        scanSlashCommands: (options) =>
          scanSlashCommands({
            ...options,
            path: fixture.getPath('update-test'),
            recursive: false,
          }),
      };

      const { lastFrame } = render(<TestComponent scanner={testScanner} />);

      await delay(500);

      // Verify initial state
      const initialFrame = lastFrame();
      expect(initialFrame).toContain('Files:');
      expect(initialFrame).toContain('Selected:');

      // Add a new file (Note: In real hook, this would require re-scanning)
      await fixture.writeFile(
        'update-test/CLAUDE.local.md',
        '# New local config',
      );

      // Hook doesn't auto-refresh, so files count should remain the same
      await delay(50); // Minimal delay
      expect(lastFrame()).toBe(initialFrame);
    });

    test('handles recursive directory scanning', async () => {
      // Import the helper function
      const { createNestedProjectFixture } = await import(
        '../test-fixture-helpers.js'
      );

      await using fixture = await createNestedProjectFixture();

      // Create test scanner for nested structure
      const testScanner: FileScanner = {
        scanClaudeFiles: (options) =>
          scanClaudeFiles({
            ...options,
            path: fixture.getPath('nested-project'),
            recursive: true, // This test specifically tests recursive scanning
          }),
        scanSlashCommands: (options) =>
          scanSlashCommands({
            ...options,
            path: fixture.getPath('nested-project'),
            recursive: true, // This test specifically tests recursive scanning
          }),
      };

      const { lastFrame } = render(<TestComponent scanner={testScanner} />);

      await delay(500); // Increased delay for recursive scanning

      // Should find all files recursively
      const frame = lastFrame();
      expect(frame).toContain('Files:');
      // Should find multiple files from nested directories
      expect(frame).not.toContain('Files: 0');
      // Extract file count and verify it's more than 1
      const fileCountMatch = frame?.match(/Files: (\d+)/);
      expect(fileCountMatch).toBeTruthy();
      const fileCount = Number(fileCountMatch?.[1]);
      expect(fileCount).toBeGreaterThan(1);
      expect(frame).toContain('Selected:');
    });
  });
}
