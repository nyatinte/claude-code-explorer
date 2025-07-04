import { render } from 'ink-testing-library';
import type { ClaudeFileInfo } from '../../_types.js';
import { createClaudeFilePath } from '../../_types.js';
import { FileItem } from './FileItem.js';

// テスト用のClaudeFileInfo作成ヘルパー
const createMockFile = (
  name: string,
  type: ClaudeFileInfo['type'],
  path = `/test/${name}`,
): ClaudeFileInfo => ({
  path: createClaudeFilePath(path),
  type,
  size: 1024,
  lastModified: new Date('2024-01-01'),
  commands: [],
  tags: [],
});

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('FileItem', () => {
    test('CLAUDE.mdファイルの表示', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');

      const { lastFrame } = render(
        <FileItem file={file} isSelected={false} isFocused={false} />,
      );

      expect(lastFrame()).toContain('CLAUDE.md');
      expect(lastFrame()).toContain('📝'); // claude-mdアイコン
    });

    test('CLAUDE.local.mdファイルの表示', () => {
      const file = createMockFile('CLAUDE.local.md', 'claude-local-md');

      const { lastFrame } = render(
        <FileItem file={file} isSelected={false} isFocused={false} />,
      );

      expect(lastFrame()).toContain('CLAUDE.local.md');
      expect(lastFrame()).toContain('🔒'); // claude-local-mdアイコン
    });

    test('スラッシュコマンドファイルの表示', () => {
      const file = createMockFile('test-command.md', 'slash-command');

      const { lastFrame } = render(
        <FileItem file={file} isSelected={false} isFocused={false} />,
      );

      expect(lastFrame()).toContain('test-command.md');
      expect(lastFrame()).toContain('⚡'); // slash-commandアイコン
    });

    test('選択状態の表示', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');

      const { lastFrame } = render(
        <FileItem file={file} isSelected={true} isFocused={false} />,
      );

      expect(lastFrame()).toContain('CLAUDE.md');
      // 選択状態の視覚的表現があることを確認
    });

    test('フォーカス状態の表示', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');

      const { lastFrame } = render(
        <FileItem file={file} isSelected={false} isFocused={true} />,
      );

      expect(lastFrame()).toContain('CLAUDE.md');
      expect(lastFrame()).toContain('► '); // フォーカス時のプレフィックス
    });

    test('選択＋フォーカス状態の表示', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');

      const { lastFrame } = render(
        <FileItem file={file} isSelected={true} isFocused={true} />,
      );

      expect(lastFrame()).toContain('CLAUDE.md');
      expect(lastFrame()).toContain('► '); // フォーカス時のプレフィックス
    });
  });
}
