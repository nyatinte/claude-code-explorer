import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { consola } from 'consola';
import { define } from 'gunshi';
// Enhanced markdown rendering
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import pc from 'picocolors';
import { previewArgs } from '../_shared-args.ts';
import { formatDate, formatFileSize } from '../_utils.ts';
import { findSlashCommandByName } from '../slash-command-scanner.ts';

export const previewCommand = define({
  name: 'preview',
  description: 'Preview the content of Claude files or slash commands',
  args: previewArgs,
  examples: `# Preview a specific file
$ claude-explorer preview --file-path ./CLAUDE.md

# Preview a slash command by name
$ claude-explorer preview --command deploy

# Show more lines
$ claude-explorer preview --file-path ./CLAUDE.md --lines 100`,

  run: async (ctx) => {
    const { filePath, command, lines } = ctx.values;

    if (!filePath && !command) {
      consola.error(
        pc.red('❌ Please specify either --file-path or --command'),
      );
      process.exit(1);
    }

    if (filePath && command) {
      consola.error(
        pc.red('❌ Please specify only one of --file-path or --command'),
      );
      process.exit(1);
    }

    try {
      if (filePath) {
        await previewFile(filePath, lines);
      } else if (command) {
        await previewSlashCommand(command, lines);
      }
    } catch (error) {
      consola.error(pc.red('❌ Preview failed:'), error);
      process.exit(1);
    }
  },
});

export const previewFile = async (filePath: string, maxLines = 50) => {
  if (!existsSync(filePath)) {
    consola.error(pc.red(`❌ File not found: ${filePath}`));
    process.exit(1);
  }

  consola.start(pc.blue(`🔍 Loading file: ${filePath}`));

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Get file stats
    const { stat } = await import('node:fs/promises');
    const stats = await stat(filePath);

    // Display file information
    console.log(pc.bold(pc.blue('\n📄 File Information:')));
    console.log(`Path: ${pc.green(filePath)}`);
    console.log(`Size: ${pc.yellow(formatFileSize(stats.size))}`);
    console.log(`Modified: ${pc.cyan(formatDate(stats.mtime))}`);
    console.log(`Lines: ${pc.magenta(lines.length.toString())}`);

    // Display content with enhanced markdown rendering
    console.log(pc.bold(pc.blue('\n📝 Content:')));
    console.log(pc.gray('─'.repeat(80)));

    // Check if it's a markdown file for enhanced rendering
    const isMarkdownFile = filePath.toLowerCase().endsWith('.md');

    if (isMarkdownFile && lines.length <= maxLines) {
      // For markdown files within size limit, use full enhanced rendering
      try {
        const renderedContent = highlightMarkdown(content, true);
        console.log(renderedContent);
      } catch (_error) {
        // Fallback to line-by-line rendering
        renderLineByLine(lines, maxLines);
      }
    } else {
      // For non-markdown or large files, use line-by-line rendering
      renderLineByLine(lines, maxLines);
    }

    console.log(pc.gray('─'.repeat(80)));

    // Show content analysis
    await showContentAnalysis(content, filePath);

    consola.success(pc.green('✅ File preview complete'));
  } catch (error) {
    consola.error(pc.red('❌ Failed to read file:'), error);
    process.exit(1);
  }
};

const previewSlashCommand = async (commandName: string, maxLines = 50) => {
  consola.start(pc.blue(`🔍 Searching for command: ${commandName}`));

  try {
    const commandInfo = await findSlashCommandByName(commandName);

    if (!commandInfo) {
      consola.error(pc.red(`❌ Slash command not found: ${commandName}`));

      // Suggest similar commands
      const { scanSlashCommands } = await import('../slash-command-scanner.ts');
      const allCommands = await scanSlashCommands();
      const similar = allCommands
        .filter(
          (cmd) =>
            cmd.name.includes(commandName) || commandName.includes(cmd.name),
        )
        .slice(0, 5);

      if (similar.length > 0) {
        console.log(pc.yellow('\n💡 Did you mean one of these?'));
        for (const cmd of similar) {
          console.log(`  ${pc.cyan(cmd.name)} ${pc.gray(`(${cmd.scope})`)}`);
        }
      }

      process.exit(1);
    }

    // Display command information
    console.log(pc.bold(pc.blue('\n⚡️ Slash Command Information:')));
    console.log(`Name: ${pc.green(commandInfo.name)}`);
    console.log(`Scope: ${pc.yellow(commandInfo.scope)}`);
    console.log(`File: ${pc.cyan(commandInfo.filePath)}`);
    console.log(
      `Modified: ${pc.magenta(formatDate(commandInfo.lastModified))}`,
    );

    if (commandInfo.namespace) {
      console.log(`Namespace: ${pc.blue(commandInfo.namespace)}`);
    }

    if (commandInfo.description) {
      console.log(`Description: ${pc.white(commandInfo.description)}`);
    }

    console.log(
      `Has Arguments: ${commandInfo.hasArguments ? pc.green('Yes') : pc.gray('No')}`,
    );

    // Load and display file content
    await previewFile(commandInfo.filePath, maxLines);
  } catch (error) {
    consola.error(pc.red('❌ Failed to preview slash command:'), error);
    process.exit(1);
  }
};

const renderLineByLine = (lines: string[], maxLines: number) => {
  const displayLines = lines.slice(0, maxLines);
  const lineNumberWidth = Math.max(3, displayLines.length.toString().length);

  for (let i = 0; i < displayLines.length; i++) {
    const lineNum = (i + 1).toString().padStart(lineNumberWidth, ' ');
    const line = displayLines[i] || '';
    console.log(`${pc.gray(lineNum)} │ ${highlightMarkdown(line)}`);
  }

  if (lines.length > maxLines) {
    console.log(pc.gray('─'.repeat(80)));
    console.log(pc.yellow(`... and ${lines.length - maxLines} more lines`));
    console.log(pc.dim(`Use --lines ${lines.length} to see all content`));
  }
};

const highlightMarkdown = (content: string, isFullContent = false): string => {
  try {
    // For full content, use marked-terminal for rich rendering
    if (isFullContent) {
      marked.setOptions({
        renderer: new TerminalRenderer({
          // CLI-optimized colors
          heading: pc.bold,
          strong: pc.bold,
          em: pc.italic,
          codespan: pc.cyan,
          code: pc.gray,
          blockquote: pc.gray,
          html: pc.gray,
          href: pc.blue,
          text: (text: string) => text,
          unescape: true,
          width: 80, // Limit width for better CLI display
          reflowText: true,
        }),
      });

      return marked(content);
    }

    // For single lines, keep simple highlighting for performance
    let highlighted = content;

    // Headers
    if (content.startsWith('# ')) {
      return pc.bold(pc.blue(content));
    }
    if (content.startsWith('## ')) {
      return pc.bold(pc.green(content));
    }
    if (content.startsWith('### ')) {
      return pc.bold(pc.yellow(content));
    }

    // Code blocks
    if (content.startsWith('```')) {
      return pc.gray(content);
    }

    // Inline code
    highlighted = highlighted.replace(/`([^`]+)`/g, (_, code) =>
      pc.cyan(`\`${code}\``),
    );

    // Bold text
    highlighted = highlighted.replace(/\*\*([^*]+)\*\*/g, (_, text) =>
      pc.bold(text),
    );

    // Italic text
    highlighted = highlighted.replace(/\*([^*]+)\*/g, (_, text) =>
      pc.italic(text),
    );

    // Links
    highlighted = highlighted.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, text) =>
      pc.underline(pc.blue(text)),
    );

    // Slash commands
    highlighted = highlighted.replace(/\/(\w+)/g, (_, cmd) =>
      pc.magenta(`/${cmd}`),
    );

    return highlighted;
  } catch (_error) {
    // Fallback to original content if highlighting fails
    return content;
  }
};

const showContentAnalysis = async (content: string, _filePath: string) => {
  console.log(pc.bold(pc.blue('\n📊 Content Analysis:')));

  // Count different elements
  const stats = {
    lines: content.split('\n').length,
    words: content.split(/\s+/).filter((word) => word.length > 0).length,
    characters: content.length,
    headers: (content.match(/^#+\s/gm) || []).length,
    codeBlocks: (content.match(/```/g) || []).length / 2,
    slashCommands: (content.match(/\/\w+/g) || []).length,
    links: (content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length,
  };

  console.log(`📏 ${pc.cyan('Lines:')} ${stats.lines}`);
  console.log(`📝 ${pc.cyan('Words:')} ${stats.words}`);
  console.log(`🔤 ${pc.cyan('Characters:')} ${stats.characters}`);
  console.log(`📑 ${pc.cyan('Headers:')} ${stats.headers}`);
  console.log(`💻 ${pc.cyan('Code blocks:')} ${stats.codeBlocks}`);
  console.log(`⚡️ ${pc.cyan('Slash commands:')} ${stats.slashCommands}`);
  console.log(`🔗 ${pc.cyan('Links:')} ${stats.links}`);

  // Extract and show sections
  const sections = extractSections(content);
  if (sections.length > 0) {
    console.log(pc.bold(pc.blue('\n📋 Sections:')));
    for (const section of sections.slice(0, 10)) {
      console.log(`  ${pc.green('•')} ${section}`);
    }
    if (sections.length > 10) {
      console.log(
        `  ${pc.gray(`... and ${sections.length - 10} more sections`)}`,
      );
    }
  }
};

const extractSections = (content: string): string[] => {
  const sections: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^#+\s/)) {
      const level = trimmed.match(/^#+/)?.[0].length || 0;
      const title = trimmed.replace(/^#+\s*/, '');
      const indent = '  '.repeat(Math.max(0, level - 1));
      sections.push(`${indent}${title}`);
    }
  }

  return sections;
};

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('previewCommand', () => {
    test('should be properly defined', () => {
      expect(previewCommand.name).toBe('preview');
      expect(previewCommand.description).toContain('Preview the content');
      expect(previewCommand.args).toBeDefined();
    });

    test('should have file-path and command arguments', () => {
      expect(previewCommand.args?.filePath).toBeDefined();
      expect(previewCommand.args?.command).toBeDefined();
      expect(previewCommand.args?.lines).toBeDefined();
    });
  });

  describe('highlightMarkdown', () => {
    test('should highlight headers', () => {
      expect(highlightMarkdown('# Main Header')).toContain('Main Header');
      expect(highlightMarkdown('## Sub Header')).toContain('Sub Header');
      expect(highlightMarkdown('### Sub Sub Header')).toContain(
        'Sub Sub Header',
      );
    });

    test('should highlight inline code', () => {
      const result = highlightMarkdown('Here is `code` snippet');
      expect(result).toContain('code');
    });

    test('should highlight slash commands', () => {
      const result = highlightMarkdown('Use /deploy command');
      expect(result).toContain('/deploy');
    });
  });

  describe('extractSections', () => {
    test('should extract markdown headers as sections', () => {
      const content = `# Main Title
## Section 1
### Subsection 1.1
## Section 2`;

      const sections = extractSections(content);
      expect(sections).toHaveLength(4);
      expect(sections[0]).toBe('Main Title');
      expect(sections[1]).toBe('  Section 1');
      expect(sections[2]).toBe('    Subsection 1.1');
    });

    test('should handle empty content', () => {
      expect(extractSections('')).toEqual([]);
      expect(extractSections('No headers here')).toEqual([]);
    });
  });
}
