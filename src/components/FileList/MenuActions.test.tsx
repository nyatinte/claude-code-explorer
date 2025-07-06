import { render } from 'ink-testing-library';
import { createMockFile } from '../../test-helpers.js';
import { MenuActions } from './MenuActions/index.js';

if (import.meta.vitest) {
  const { describe, test, expect, vi } = import.meta.vitest;

  describe('MenuActions', () => {
    test('basic menu action display', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain('📋 Actions');
      expect(lastFrame()).toContain('/test/CLAUDE.md');
      expect(lastFrame()).toContain('[C] Copy Content');
      expect(lastFrame()).toContain('[P] Copy Path (Absolute)');
      expect(lastFrame()).toContain('[R] Copy Path (Relative)');
      expect(lastFrame()).toContain('[D] Copy Current Directory');
      expect(lastFrame()).toContain('[O] Open File');
    });

    test('initial selection state display', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      // First item is selected
      expect(lastFrame()).toContain('► [C] Copy Content');
    });

    test('keyboard navigation information display', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain(
        '↑↓: Navigate | Enter: Execute | [Key]: Direct action | Esc: Close',
      );
    });

    test('display with different file types', () => {
      const file = createMockFile(
        'test-command.md',
        'slash-command',
        '/project/.claude/commands/test-command.md',
      );
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain('📋 Actions');
      expect(lastFrame()).toContain(
        '/project/.claude/commands/test-command.md',
      );
    });

    test('all actions exist', () => {
      const file = createMockFile('CLAUDE.local.md', 'claude-local-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      // Verify 5 actions are present
      expect(lastFrame()).toContain('[C] Copy Content');
      expect(lastFrame()).toContain('[P] Copy Path (Absolute)');
      expect(lastFrame()).toContain('[R] Copy Path (Relative)');
      expect(lastFrame()).toContain('[D] Copy Current Directory');
      expect(lastFrame()).toContain('[O] Open File');
    });

    test('menu header information', () => {
      const file = createMockFile('CLAUDE.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();
      expect(output).toContain('📋 Actions');
      expect(output).toContain('/test/CLAUDE.md');
    });

    test('menu action order', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // Verify actions are displayed in correct order
      const copyContentIndex = output?.indexOf('[C] Copy Content') ?? -1;
      const copyAbsoluteIndex =
        output?.indexOf('[P] Copy Path (Absolute)') ?? -1;
      const copyRelativeIndex =
        output?.indexOf('[R] Copy Path (Relative)') ?? -1;
      const copyDirIndex = output?.indexOf('[D] Copy Current Directory') ?? -1;
      const openFileIndex = output?.indexOf('[O] Open File') ?? -1;

      expect(copyContentIndex).toBeGreaterThan(-1);
      expect(copyAbsoluteIndex).toBeGreaterThan(copyContentIndex);
      expect(copyRelativeIndex).toBeGreaterThan(copyAbsoluteIndex);
      expect(copyDirIndex).toBeGreaterThan(copyRelativeIndex);
      expect(openFileIndex).toBeGreaterThan(copyDirIndex);
    });

    test('long file path display', () => {
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

    test('file path with special characters display', () => {
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

    test('global config file display', () => {
      const file = createMockFile(
        'CLAUDE.md',
        'global-md',
        '/Users/username/.claude/CLAUDE.md',
      );
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      expect(lastFrame()).toContain('📋 Actions');
      expect(lastFrame()).toContain('/Users/username/.claude/CLAUDE.md');
    });

    test('menu layout structure', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // Verify layout elements
      expect(output).toContain('📋 Actions');
      expect(output).toContain('► [C] Copy Content'); // Selection indicator
      expect(output).toContain('↑↓: Navigate'); // Help text
    });

    test('action description text verification', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // Verify each action label
      expect(output).toContain('Copy Content');
      expect(output).toContain('Copy Path (Absolute)');
      expect(output).toContain('Copy Path (Relative)');
      expect(output).toContain('Copy Current Directory');
      expect(output).toContain('Open File');
    });

    test('keyboard shortcut display', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // Verify each action key binding
      expect(output).toContain('[C]');
      expect(output).toContain('[P]');
      expect(output).toContain('[R]');
      expect(output).toContain('[D]');
      expect(output).toContain('[O]');
    });

    test('menu help section', () => {
      const file = createMockFile('test.md', 'claude-md');
      const onClose = vi.fn();

      const { lastFrame } = render(
        <MenuActions file={file} onClose={onClose} />,
      );

      const output = lastFrame();

      // Verify each help text element
      expect(output).toContain('↑↓: Navigate');
      expect(output).toContain('Enter: Execute');
      expect(output).toContain('[Key]: Direct action');
      expect(output).toContain('Esc: Close');
    });

    test('display verification with different filenames', () => {
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

        expect(lastFrame()).toContain('📋 Actions');
        expect(lastFrame()).toContain(file.path);
      });
    });

    test('menu rendering stability', () => {
      const file1 = createMockFile('file1.md', 'claude-md');
      const file2 = createMockFile('file2.md', 'claude-local-md');
      const onClose = vi.fn();

      const { lastFrame, rerender } = render(
        <MenuActions file={file1} onClose={onClose} />,
      );

      expect(lastFrame()).toContain('file1.md');

      // Re-render with different file
      rerender(<MenuActions file={file2} onClose={onClose} />);

      expect(lastFrame()).toContain('file2.md');
      expect(lastFrame()).toContain('[C] Copy Content');
    });
  });
}
