import { render } from 'ink-testing-library';
import { createMockFile } from '../../test-helpers.js';
import { MenuActions } from './MenuActions/index.js';

if (import.meta.vitest) {
  const { describe, test, expect, vi } = import.meta.vitest;

  describe('MenuActions', () => {
    test('メニューアクションの基本表示', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain('📋 Action Menu - /test/CLAUDE.md');
      expect(lastFrame()).toContain('[C] Copy Content');
      expect(lastFrame()).toContain('[P] Copy Path (Absolute)');
      expect(lastFrame()).toContain('[R] Copy Path (Relative)');
      expect(lastFrame()).toContain('[D] Copy Current Directory');
      expect(lastFrame()).toContain('[O] Open File');
    });

    test('初期選択状態の表示', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      // 最初の項目が選択されている
      expect(lastFrame()).toContain('► [C] Copy Content');
    });

    test('キーボードナビゲーション情報の表示', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain(
        '↑↓: Navigate | Enter: Execute | [Key]: Direct action | Esc: Close',
      );
    });

    test('異なるファイルタイプでの表示', () => {
      const file = createMockFile(
        'test-command.md',
        'slash-command',
        '/project/.claude/commands/test-command.md',
      );
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain(
        '📋 Action Menu - /project/.claude/commands/test-command.md',
      );
    });

    test('全アクションの存在確認', () => {
      const file = createMockFile('CLAUDE.local.md', 'claude-local-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      // 5つのアクションがあることを確認
      expect(lastFrame()).toContain('[C] Copy Content');
      expect(lastFrame()).toContain('[P] Copy Path (Absolute)');
      expect(lastFrame()).toContain('[R] Copy Path (Relative)');
      expect(lastFrame()).toContain('[D] Copy Current Directory');
      expect(lastFrame()).toContain('[O] Open File');
    });

    test('メニューのヘッダー情報', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();
      expect(output).toContain('📋 Action Menu');
      expect(output).toContain('/test/CLAUDE.md');
    });

    test('メニューアクションの順序', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // アクションが正しい順序で表示されていることを確認
      const copyContentIndex = output.indexOf('[C] Copy Content');
      const copyAbsoluteIndex = output.indexOf('[P] Copy Path (Absolute)');
      const copyRelativeIndex = output.indexOf('[R] Copy Path (Relative)');
      const copyDirIndex = output.indexOf('[D] Copy Current Directory');
      const openFileIndex = output.indexOf('[O] Open File');

      expect(copyContentIndex).toBeGreaterThan(-1);
      expect(copyAbsoluteIndex).toBeGreaterThan(copyContentIndex);
      expect(copyRelativeIndex).toBeGreaterThan(copyAbsoluteIndex);
      expect(copyDirIndex).toBeGreaterThan(copyRelativeIndex);
      expect(openFileIndex).toBeGreaterThan(copyDirIndex);
    });

    test('長いファイルパスの表示', () => {
      const file = createMockFile(
        'very-long-filename.md',
        'slash-command',
        '/very/long/path/to/project/.claude/commands/very-long-filename.md',
      );
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain(
        '/very/long/path/to/project/.claude/commands/very-long-filename.md',
      );
    });

    test('特殊文字を含むファイルパスの表示', () => {
      const file = createMockFile(
        'file with spaces & symbols.md',
        'claude-md',
        '/path/with spaces & symbols/file with spaces & symbols.md',
      );
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain(
        '/path/with spaces & symbols/file with spaces & symbols.md',
      );
    });

    test('グローバル設定ファイルの表示', () => {
      const file = createMockFile(
        'CLAUDE.md',
        'global-md',
        '/Users/username/.claude/CLAUDE.md',
      );
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain(
        '📋 Action Menu - /Users/username/.claude/CLAUDE.md',
      );
    });

    test('メニューのレイアウト構造', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // レイアウト要素の確認
      expect(output).toContain('📋 Action Menu');
      expect(output).toContain('► [C] Copy Content'); // 選択インジケーター
      expect(output).toContain('↑↓: Navigate'); // ヘルプテキスト
    });

    test('アクションの説明テキスト確認', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // 各アクションのラベルを確認
      expect(output).toContain('Copy Content');
      expect(output).toContain('Copy Path (Absolute)');
      expect(output).toContain('Copy Path (Relative)');
      expect(output).toContain('Copy Current Directory');
      expect(output).toContain('Open File');
    });

    test('キーボードショートカットの表示', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // 各アクションのキーバインドを確認
      expect(output).toContain('[C]');
      expect(output).toContain('[P]');
      expect(output).toContain('[R]');
      expect(output).toContain('[D]');
      expect(output).toContain('[O]');
    });

    test('メニューのヘルプセクション', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // ヘルプテキストの各要素を確認
      expect(output).toContain('↑↓: Navigate');
      expect(output).toContain('Enter: Execute');
      expect(output).toContain('[Key]: Direct action');
      expect(output).toContain('Esc: Close');
    });

    test('異なるファイル名での表示確認', () => {
      const files = [
        createMockFile('config.md', 'claude-md'),
        createMockFile('settings.md', 'claude-local-md'),
        createMockFile('deploy.md', 'slash-command'),
      ];

      files.forEach((file) => {
        const onClose = vi.fn();
        const { lastFrame } = render(
          <MenuActions file={file} onClose={onClose} />,
        );

        expect(lastFrame()).toContain(`📋 Action Menu - ${file.path}`);
      });
    });

    test('メニューレンダリングの安定性', () => {
      const file1 = createMockFile('file1.md', 'claude-md');
      const file2 = createMockFile('file2.md', 'claude-local-md');
      const onClose = vi.fn();

      const { lastFrame, rerender } = render(
        <MenuActions file={file1} onClose={onClose} />,
      );

      expect(lastFrame()).toContain('file1.md');

      // 別のファイルで再レンダリング
      rerender(<MenuActions file={file2} onClose={onClose} />);

      expect(lastFrame()).toContain('file2.md');
      expect(lastFrame()).toContain('[C] Copy Content');
    });
  });
}
