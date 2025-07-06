import { Text } from 'ink';
import { render } from 'ink-testing-library';
import type { ClaudeFileInfo, SlashCommandInfo } from '../_types.js';
import { createClaudeFilePath } from '../_types.js';
import { scanClaudeFiles } from '../claude-md-scanner.js';
import { scanSlashCommands } from '../slash-command-scanner.js';
import { createMockFile, createMockSlashCommand } from '../test-helpers.js';
import { delay } from '../test-utils.js';
import { useFileNavigation } from './useFileNavigation.js';

// Module mocks
vi.mock('../claude-md-scanner.js');
vi.mock('../slash-command-scanner.js');

// Test component (for testing useFileNavigation)
function TestComponent() {
  const { files, selectedFile, isLoading, error } = useFileNavigation();

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
  const { describe, test, expect, vi, beforeEach } = import.meta.vitest;

  // Mock typing
  const mockedScanClaudeFiles = vi.mocked(scanClaudeFiles);
  const mockedScanSlashCommands = vi.mocked(scanSlashCommands);

  beforeEach(() => {
    // Reset mocks before each test
    mockedScanClaudeFiles.mockClear();
    mockedScanSlashCommands.mockClear();
    vi.clearAllTimers();
  });

  describe('useFileNavigation', () => {
    test('files are loaded and sorted correctly', async () => {
      const claudeFiles: ClaudeFileInfo[] = [
        createMockFile('z-file.md', 'claude-md', '/project/z-file.md'),
        createMockFile('a-file.md', 'claude-local-md', '/project/a-file.md'),
      ];

      const slashCommands: SlashCommandInfo[] = [
        createMockSlashCommand('m-command', {
          filePath: createClaudeFilePath(
            '/project/.claude/commands/m-command.md',
          ),
        }),
      ];

      mockedScanClaudeFiles.mockResolvedValue(claudeFiles);
      mockedScanSlashCommands.mockResolvedValue(slashCommands);

      const { lastFrame } = render(<TestComponent />);

      // Initial state is loading
      expect(lastFrame()).toContain('Loading...');

      // Wait for async processing to complete
      await delay(100);

      // Verify results
      expect(lastFrame()).toContain('Files: 3');
      expect(lastFrame()).toContain('Selected: /project/z-file.md'); // First file in claude-md group

      // Verify scan functions were called with correct options
      expect(mockedScanClaudeFiles).toHaveBeenCalledWith({ recursive: true });
      expect(mockedScanSlashCommands).toHaveBeenCalledWith({ recursive: true });
    });

    test('error state is set when Claude file loading fails', async () => {
      const errorMessage = 'Failed to scan Claude files';
      mockedScanClaudeFiles.mockRejectedValue(new Error(errorMessage));
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      // Initial state is loading
      expect(lastFrame()).toContain('Loading...');

      // Wait for async processing to complete
      await delay(100);

      expect(lastFrame()).toContain(`Error: ${errorMessage}`);
    });

    test('error state is set when slash command loading fails', async () => {
      const errorMessage = 'Failed to scan slash commands';
      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockRejectedValue(new Error(errorMessage));

      const { lastFrame } = render(<TestComponent />);

      // Initial state is loading
      expect(lastFrame()).toContain('Loading...');

      // Wait for async processing to complete
      await delay(100);

      expect(lastFrame()).toContain(`Error: ${errorMessage}`);
    });

    test('fallback when error message does not exist', async () => {
      // Error object without message
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';

      mockedScanClaudeFiles.mockRejectedValue(errorWithoutMessage);
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Error: Failed to scan files');
    });

    test('when empty results are returned', async () => {
      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 0');
      expect(lastFrame()).not.toContain('Selected:');
    });

    test('SlashCommandInfo to ClaudeFileInfo conversion works correctly', async () => {
      const slashCommand = createMockSlashCommand('deploy', {
        description: 'Deploy to production',
        hasArguments: true,
        namespace: 'production',
        filePath: createClaudeFilePath('/.claude/commands/deploy.md'),
      });

      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockResolvedValue([slashCommand]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 1');
      expect(lastFrame()).toContain('Selected: /.claude/commands/deploy.md');
    });

    test('SlashCommand conversion without namespace', async () => {
      const slashCommand = createMockSlashCommand('test', {
        namespace: undefined,
        filePath: createClaudeFilePath('/.claude/commands/test.md'),
      });

      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockResolvedValue([slashCommand]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 1');
      expect(lastFrame()).toContain('Selected: /.claude/commands/test.md');
    });

    test('file sorting functionality verification', async () => {
      const claudeFiles: ClaudeFileInfo[] = [
        createMockFile('z-file.md', 'claude-md', '/project/z-file.md'),
        createMockFile('a-file.md', 'claude-local-md', '/project/a-file.md'),
        createMockFile('m-file.md', 'slash-command', '/project/m-file.md'),
      ];

      mockedScanClaudeFiles.mockResolvedValue(claudeFiles);
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Sorted by group order, first file in claude-md group (z-file.md) is selected
      expect(lastFrame()).toContain('Files: 3');
      expect(lastFrame()).toContain('Selected: /project/z-file.md');
    });

    test('mixing multiple file types', async () => {
      const claudeFiles: ClaudeFileInfo[] = [
        createMockFile('CLAUDE.md', 'claude-md', '/project/CLAUDE.md'),
        createMockFile(
          'CLAUDE.local.md',
          'claude-local-md',
          '/project/CLAUDE.local.md',
        ),
      ];

      const slashCommands: SlashCommandInfo[] = [
        createMockSlashCommand('deploy', {
          filePath: createClaudeFilePath('/project/.claude/commands/deploy.md'),
        }),
        createMockSlashCommand('test', {
          filePath: createClaudeFilePath('/project/.claude/commands/test.md'),
        }),
      ];

      mockedScanClaudeFiles.mockResolvedValue(claudeFiles);
      mockedScanSlashCommands.mockResolvedValue(slashCommands);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 4');
      // Sorted by group order, so first file in claude-md group (CLAUDE.md) is selected
      expect(lastFrame()).toContain('Selected: /project/CLAUDE.md');
    });
  });
}
