import { Text } from 'ink';
import { render } from 'ink-testing-library';
import type { ClaudeFileInfo, SlashCommandInfo } from '../_types.js';
import { scanClaudeFiles } from '../claude-md-scanner.js';
import { scanSlashCommands } from '../slash-command-scanner.js';
import { createMockFile, createMockSlashCommand } from '../test-helpers.js';
import { useFileNavigation } from './useFileNavigation.js';

// モジュールのモック
vi.mock('../claude-md-scanner.js');
vi.mock('../slash-command-scanner.js');

// テスト用コンポーネント（useFileNavigationをテストするため）
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

  // モックの型付け
  const mockedScanClaudeFiles = vi.mocked(scanClaudeFiles);
  const mockedScanSlashCommands = vi.mocked(scanSlashCommands);

  beforeEach(() => {
    // 各テストの前にモックをリセット
    mockedScanClaudeFiles.mockClear();
    mockedScanSlashCommands.mockClear();
    vi.clearAllTimers();
  });

  describe('useFileNavigation', () => {
    test('ファイルの読み込みとソートが正常に行われる', async () => {
      const claudeFiles: ClaudeFileInfo[] = [
        createMockFile('z-file.md', 'claude-md', '/project/z-file.md'),
        createMockFile('a-file.md', 'claude-local-md', '/project/a-file.md'),
      ];

      const slashCommands: SlashCommandInfo[] = [
        createMockSlashCommand('m-command', {
          filePath: '/project/.claude/commands/m-command.md',
        }),
      ];

      mockedScanClaudeFiles.mockResolvedValue(claudeFiles);
      mockedScanSlashCommands.mockResolvedValue(slashCommands);

      const { lastFrame } = render(<TestComponent />);

      // 初期状態はローディング中
      expect(lastFrame()).toContain('Loading...');

      // 非同期処理の完了を待つ
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 結果の確認
      expect(lastFrame()).toContain('Files: 3');
      expect(lastFrame()).toContain('Selected: /project/a-file.md'); // ソート後の最初のファイル

      // スキャン関数が正しいオプションで呼ばれたことを確認
      expect(mockedScanClaudeFiles).toHaveBeenCalledWith({ recursive: true });
      expect(mockedScanSlashCommands).toHaveBeenCalledWith({ recursive: true });
    });

    test('Claude ファイル読み込みエラー時にエラー状態が設定される', async () => {
      const errorMessage = 'Failed to scan Claude files';
      mockedScanClaudeFiles.mockRejectedValue(new Error(errorMessage));
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      // 初期状態はローディング中
      expect(lastFrame()).toContain('Loading...');

      // 非同期処理の完了を待つ
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain(`Error: ${errorMessage}`);
    });

    test('スラッシュコマンド読み込みエラー時にエラー状態が設定される', async () => {
      const errorMessage = 'Failed to scan slash commands';
      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockRejectedValue(new Error(errorMessage));

      const { lastFrame } = render(<TestComponent />);

      // 初期状態はローディング中
      expect(lastFrame()).toContain('Loading...');

      // 非同期処理の完了を待つ
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain(`Error: ${errorMessage}`);
    });

    test('エラーメッセージが存在しない場合のフォールバック', async () => {
      // メッセージのないエラーオブジェクト
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';

      mockedScanClaudeFiles.mockRejectedValue(errorWithoutMessage);
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Error: Failed to scan files');
    });

    test('空の結果が返された場合', async () => {
      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 0');
      expect(lastFrame()).not.toContain('Selected:');
    });

    test('SlashCommandInfo から ClaudeFileInfo への変換が正しく行われる', async () => {
      const slashCommand = createMockSlashCommand('deploy', {
        description: 'Deploy to production',
        hasArguments: true,
        namespace: 'production',
        filePath: '/.claude/commands/deploy.md',
      });

      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockResolvedValue([slashCommand]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 1');
      expect(lastFrame()).toContain('Selected: /.claude/commands/deploy.md');
    });

    test('namespace がない SlashCommand の変換', async () => {
      const slashCommand = createMockSlashCommand('test', {
        namespace: undefined,
        filePath: '/.claude/commands/test.md',
      });

      mockedScanClaudeFiles.mockResolvedValue([]);
      mockedScanSlashCommands.mockResolvedValue([slashCommand]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 1');
      expect(lastFrame()).toContain('Selected: /.claude/commands/test.md');
    });

    test('ファイルソート機能の確認', async () => {
      const claudeFiles: ClaudeFileInfo[] = [
        createMockFile('z-file.md', 'claude-md', '/project/z-file.md'),
        createMockFile('a-file.md', 'claude-local-md', '/project/a-file.md'),
        createMockFile('m-file.md', 'slash-command', '/project/m-file.md'),
      ];

      mockedScanClaudeFiles.mockResolvedValue(claudeFiles);
      mockedScanSlashCommands.mockResolvedValue([]);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // ファイル名でソートされて、最初のファイル（a-file.md）が選択されている
      expect(lastFrame()).toContain('Files: 3');
      expect(lastFrame()).toContain('Selected: /project/a-file.md');
    });

    test('複数のファイルタイプの混合', async () => {
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
          filePath: '/project/.claude/commands/deploy.md',
        }),
        createMockSlashCommand('test', {
          filePath: '/project/.claude/commands/test.md',
        }),
      ];

      mockedScanClaudeFiles.mockResolvedValue(claudeFiles);
      mockedScanSlashCommands.mockResolvedValue(slashCommands);

      const { lastFrame } = render(<TestComponent />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain('Files: 4');
      // CLAUDE.local.md が最初にソートされる
      expect(lastFrame()).toContain('Selected: /project/CLAUDE.local.md');
    });
  });
}
