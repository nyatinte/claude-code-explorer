import { render } from 'ink-testing-library';
import { createMockFile, mockFilePresets } from '../../test-helpers.js';
import { FileList } from './FileList.js';

if (import.meta.vitest) {
  const { describe, test, expect, vi, beforeEach } = import.meta.vitest;

  describe('FileList', () => {
    let onFileSelect: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      onFileSelect = vi.fn();
    });

    describe('基本表示とレンダリング', () => {
      test('ファイルリストの基本表示', () => {
        const files = mockFilePresets.basic();

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Claude Files (2)');
        expect(lastFrame()).toContain('CLAUDE.md');
        expect(lastFrame()).toContain('CLAUDE.local.md');
      });

      test('空のファイルリストの表示', () => {
        const { lastFrame } = render(
          <FileList files={[]} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Claude Files (0)');
        expect(lastFrame()).toContain('No files found');
      });

      test('検索プレースホルダーの表示', () => {
        const files = [createMockFile('CLAUDE.md', 'claude-md')];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Type to filter files...');
      });

      test('キーボードナビゲーション情報の表示', () => {
        const files = [createMockFile('CLAUDE.md', 'claude-md')];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain(
          '↑↓: Navigate | Enter: Menu | Tab: Search | Esc: Exit',
        );
      });

      test('初回レンダリング時の自動ファイル選択', () => {
        const files = [
          createMockFile('CLAUDE.md', 'claude-md'),
          createMockFile('test.md', 'slash-command'),
        ];

        render(<FileList files={files} onFileSelect={onFileSelect} />);

        // 初回レンダリング時に最初のファイルが選択される
        expect(onFileSelect).toHaveBeenCalledWith(files[0]);
      });

      test('複数ファイルの表示', () => {
        const files = mockFilePresets.withSlashCommands();

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Claude Files (3)');
        expect(lastFrame()).toContain('CLAUDE.md');
        expect(lastFrame()).toContain('deploy.md');
        expect(lastFrame()).toContain('test.md');
      });

      test('selectedFileプロップの処理', () => {
        const files = [
          createMockFile('CLAUDE.md', 'claude-md'),
          createMockFile('test.md', 'slash-command'),
        ];
        const selectedFile = files[1];

        const { lastFrame } = render(
          <FileList
            files={files}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />,
        );

        expect(lastFrame()).toContain('CLAUDE.md');
        expect(lastFrame()).toContain('test.md');
      });

      test('ファイルアイテムの表示スタイル', () => {
        const files = [
          createMockFile('CLAUDE.md', 'claude-md'),
          createMockFile('deploy.md', 'slash-command'),
          createMockFile('CLAUDE.local.md', 'claude-local-md'),
        ];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        const output = lastFrame();
        expect(output).toContain('CLAUDE.md');
        expect(output).toContain('deploy.md');
        expect(output).toContain('CLAUDE.local.md');
      });

      test('長いファイルパスの表示', () => {
        const files = [
          createMockFile(
            'very-long-filename-that-might-be-truncated.md',
            'claude-md',
            '/very/long/path/to/project/docs/very-long-filename-that-might-be-truncated.md',
          ),
        ];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain(
          'very-long-filename-that-might-be-truncated.md',
        );
      });

      test('特殊文字を含むファイル名の表示', () => {
        const files = [
          createMockFile('file with spaces & symbols.md', 'claude-md'),
          createMockFile('file-with-dashes.md', 'claude-local-md'),
          createMockFile('file_with_underscores.md', 'slash-command'),
        ];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        const output = lastFrame();
        expect(output).toContain('file with spaces & symbols.md');
        expect(output).toContain('file-with-dashes.md');
        expect(output).toContain('file_with_underscores.md');
      });

      test('異なるファイルタイプの表示', () => {
        const files = [
          createMockFile('CLAUDE.md', 'claude-md'),
          createMockFile('CLAUDE.local.md', 'claude-local-md'),
          createMockFile('deploy.md', 'slash-command'),
          createMockFile(
            'CLAUDE.md',
            'global-md',
            '/Users/test/.claude/CLAUDE.md',
          ),
        ];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Claude Files (4)');
        // 各タイプのファイルが表示されていることを確認
        const output = lastFrame();
        expect(output).toContain('CLAUDE.md');
        expect(output).toContain('deploy.md');
      });

      test('ファイルリストのレンダリング安定性', () => {
        const files1 = [createMockFile('file1.md', 'claude-md')];
        const files2 = [
          createMockFile('file1.md', 'claude-md'),
          createMockFile('file2.md', 'claude-local-md'),
        ];

        const { lastFrame, rerender } = render(
          <FileList files={files1} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Claude Files (1)');

        // ファイルリストを変更して再レンダリング
        rerender(<FileList files={files2} onFileSelect={onFileSelect} />);

        expect(lastFrame()).toContain('Claude Files (2)');
      });

      test('onFileSelectコールバックの呼び出し頻度', () => {
        const files = [createMockFile('test.md', 'claude-md')];

        render(<FileList files={files} onFileSelect={onFileSelect} />);

        // 初回レンダリング時に1回呼ばれることを確認
        expect(onFileSelect).toHaveBeenCalledTimes(1);
        expect(onFileSelect).toHaveBeenCalledWith(files[0]);
      });

      test('props変更時の動作', () => {
        const files1 = [createMockFile('file1.md', 'claude-md')];
        const files2 = [createMockFile('file2.md', 'claude-local-md')];

        const { rerender } = render(
          <FileList files={files1} onFileSelect={onFileSelect} />,
        );

        // 最初のファイルで呼ばれる
        expect(onFileSelect).toHaveBeenLastCalledWith(files1[0]);

        // ファイルリストを変更
        rerender(<FileList files={files2} onFileSelect={onFileSelect} />);

        // 新しいファイルで再度呼ばれる
        expect(onFileSelect).toHaveBeenLastCalledWith(files2[0]);
      });

      test('空配列から非空配列への変更', () => {
        const files = [createMockFile('test.md', 'claude-md')];

        const { lastFrame, rerender } = render(
          <FileList files={[]} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('No files found');

        // ファイルを追加
        rerender(<FileList files={files} onFileSelect={onFileSelect} />);

        expect(lastFrame()).toContain('test.md');
        expect(onFileSelect).toHaveBeenCalledWith(files[0]);
      });

      test('コンポーネントの構造要素確認', () => {
        const files = [createMockFile('test.md', 'claude-md')];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        const output = lastFrame();

        // 必要な UI 要素の存在確認
        expect(output).toContain('Claude Files');
        expect(output).toContain('Type to filter files...');
        expect(output).toContain('↑↓: Navigate');
        expect(output).toContain('Enter: Menu');
        expect(output).toContain('Tab: Search');
        expect(output).toContain('Esc: Exit');
      });
    });

    describe('状態管理とロジック検証', () => {
      test('ファイル選択状態の初期化', () => {
        const files = [
          createMockFile('file1.md', 'claude-md'),
          createMockFile('file2.md', 'claude-md'),
          createMockFile('file3.md', 'claude-md'),
        ];

        render(<FileList files={files} onFileSelect={onFileSelect} />);

        // 初回レンダリング時に最初のファイルが選択される
        expect(onFileSelect).toHaveBeenCalledWith(files[0]);
      });

      test('ファイルリスト変更時の選択状態の適切な調整', () => {
        const files1 = [
          createMockFile('file1.md', 'claude-md'),
          createMockFile('file2.md', 'claude-md'),
          createMockFile('file3.md', 'claude-md'),
        ];

        const files2 = [createMockFile('new-file.md', 'claude-md')];

        const { rerender } = render(
          <FileList files={files1} onFileSelect={onFileSelect} />,
        );

        onFileSelect.mockClear();

        // ファイルリストを変更
        rerender(<FileList files={files2} onFileSelect={onFileSelect} />);

        // 新しいファイルリストの最初のファイルが選択される
        expect(onFileSelect).toHaveBeenCalledWith(files2[0]);
      });

      test('空のファイルリストへの変更時の安全な処理', () => {
        const files = [createMockFile('file1.md', 'claude-md')];

        const { rerender } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        onFileSelect.mockClear();

        // 空のファイルリストに変更
        rerender(<FileList files={[]} onFileSelect={onFileSelect} />);

        // 空の場合はonFileSelectが追加で呼ばれない
        expect(onFileSelect).not.toHaveBeenCalled();
      });

      test('フィルタリング機能の基本動作確認', () => {
        const files = [
          createMockFile('CLAUDE.md', 'claude-md'),
          createMockFile('deploy.md', 'slash-command'),
          createMockFile('test.md', 'slash-command'),
        ];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        // 検索入力フィールドが表示されている
        expect(lastFrame()).toContain('Type to filter files...');
      });

      test('ファイル数表示の動的更新', () => {
        const files1 = [createMockFile('file1.md', 'claude-md')];
        const files2 = [
          createMockFile('file1.md', 'claude-md'),
          createMockFile('file2.md', 'claude-md'),
        ];

        const { lastFrame, rerender } = render(
          <FileList files={files1} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Claude Files (1)');

        rerender(<FileList files={files2} onFileSelect={onFileSelect} />);

        expect(lastFrame()).toContain('Claude Files (2)');
      });

      test('コンポーネントの安定性 - 複数回再レンダリング', () => {
        const files = mockFilePresets.basic();

        const { rerender, lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        // 複数回rerenderしても安定していることを確認
        for (let i = 0; i < 5; i++) {
          rerender(<FileList files={files} onFileSelect={onFileSelect} />);
          expect(lastFrame()).toContain('Claude Files (2)');
        }
      });

      test('大量ファイル表示での基本動作', () => {
        const manyFiles = Array.from({ length: 50 }, (_, i) =>
          createMockFile(`file${i}.md`, 'claude-md'),
        );

        const { lastFrame } = render(
          <FileList files={manyFiles} onFileSelect={onFileSelect} />,
        );

        expect(lastFrame()).toContain('Claude Files (50)');
        // レンダリングが完了することを確認
        expect(lastFrame().length).toBeGreaterThan(0);
      });
    });

    describe('エラーハンドリングと境界ケース', () => {
      test('undefinedプロップの安全な処理', () => {
        const files = mockFilePresets.basic();

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={vi.fn()} />,
        );

        expect(lastFrame()).toContain('Claude Files (2)');
      });

      test('異なるファイルタイプでの表示一貫性', () => {
        const files = [
          createMockFile('test1.md', 'claude-md'),
          createMockFile('test2.md', 'claude-local-md'),
          createMockFile('test3.md', 'slash-command'),
        ];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        // 各ファイルが表示されることを確認
        expect(lastFrame()).toContain('test1.md');
        expect(lastFrame()).toContain('test2.md');
        expect(lastFrame()).toContain('test3.md');
        expect(lastFrame()).toContain('Claude Files (3)');
      });

      test('ファイルパスの特殊ケース処理', () => {
        const files = [
          createMockFile('', 'claude-md', '/project/empty-name.md'),
          createMockFile('file with spaces.md', 'claude-md'),
          createMockFile('file-@#$%.md', 'claude-md'),
        ];

        const { lastFrame } = render(
          <FileList files={files} onFileSelect={onFileSelect} />,
        );

        // エラーなくレンダリングされることを確認
        expect(lastFrame()).toContain('Claude Files (3)');
        expect(lastFrame().length).toBeGreaterThan(0);
      });
    });
  });
}
