import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { consola } from 'consola';
import { define } from 'gunshi';
import pc from 'picocolors';
import { copyArgs } from '../_shared-args.ts';
import { findSlashCommandByName } from '../slash-command-scanner.ts';

export const copyCommand = define({
  name: 'copy',
  description:
    'Copy Claude files or slash commands to destination or clipboard',
  args: copyArgs,
  examples: `# Copy file to another location
$ claude-explorer copy --source ./CLAUDE.md --to ./project/CLAUDE.md

# Copy to clipboard
$ claude-explorer copy --source ./CLAUDE.md --clipboard

# Copy specific section only
$ claude-explorer copy --source ./CLAUDE.md --section "Build Commands" --clipboard

# Copy slash command to current directory
$ claude-explorer copy --source deploy --to ./commands/`,

  run: async (ctx) => {
    const { source, to, clipboard, section } = ctx.values;

    if (!clipboard && !to) {
      consola.error(
        pc.red('❌ Please specify either --to <destination> or --clipboard'),
      );
      process.exit(1);
    }

    try {
      // Determine if source is a file path or command name
      let sourceFilePath: string;
      let isSlashCommand = false;

      if (existsSync(source)) {
        sourceFilePath = source;
      } else {
        // Try to find as slash command
        const commandInfo = await findSlashCommandByName(source);
        if (commandInfo) {
          sourceFilePath = commandInfo.filePath;
          isSlashCommand = true;
          consola.info(
            pc.blue(`📍 Found slash command: ${source} at ${sourceFilePath}`),
          );
        } else {
          consola.error(
            pc.red(
              `❌ Source not found: ${source} (not a file or slash command)`,
            ),
          );
          process.exit(1);
        }
      }

      // Read source content
      consola.start(pc.blue(`📖 Reading source: ${sourceFilePath}`));
      const content = await readFile(sourceFilePath, 'utf-8');

      // Extract section if specified
      let finalContent = content;
      if (section) {
        const sectionContent = extractSection(content, section);
        if (!sectionContent) {
          consola.error(pc.red(`❌ Section "${section}" not found in file`));
          process.exit(1);
        }
        finalContent = sectionContent;
        consola.info(pc.green(`✂️  Extracted section: ${section}`));
      }

      if (clipboard) {
        await copyToClipboard(finalContent, sourceFilePath, section);
      } else if (to) {
        await copyToFile(finalContent, sourceFilePath, to, isSlashCommand);
      }
    } catch (error) {
      consola.error(pc.red('❌ Copy operation failed:'), error);
      process.exit(1);
    }
  },
});

const extractSection = (
  content: string,
  sectionName: string,
): string | null => {
  const lines = content.split('\n');
  let sectionStart = -1;
  let sectionEnd = lines.length;
  let sectionLevel = 0;

  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const headerMatch = line.match(/^(#+)\s+(.*)$/);

    if (headerMatch) {
      const level = headerMatch[1]?.length;
      const title = headerMatch[2]?.trim();

      if (
        level &&
        title &&
        title.toLowerCase().includes(sectionName.toLowerCase())
      ) {
        sectionStart = i;
        sectionLevel = level;
        break;
      }
    }
  }

  if (sectionStart === -1) {
    return null;
  }

  // Find section end (next header at same or higher level)
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const headerMatch = line.match(/^(#+)\s/);

    if (headerMatch) {
      const level = headerMatch[1]?.length;
      if (level && level <= sectionLevel) {
        sectionEnd = i;
        break;
      }
    }
  }

  return lines.slice(sectionStart, sectionEnd).join('\n');
};

const copyToClipboard = async (
  content: string,
  sourcePath: string,
  section?: string,
) => {
  try {
    // Try to use system clipboard
    const { spawn } = await import('node:child_process');

    // Detect platform and use appropriate command
    const platform = process.platform;
    let clipboardCommand: string[];

    switch (platform) {
      case 'darwin':
        clipboardCommand = ['pbcopy'];
        break;
      case 'linux':
        clipboardCommand = ['xclip', '-selection', 'clipboard'];
        break;
      case 'win32':
        clipboardCommand = ['clip'];
        break;
      default:
        throw new Error(`Clipboard not supported on platform: ${platform}`);
    }

    const command = clipboardCommand[0];
    if (!command) {
      throw new Error('No clipboard command available');
    }
    const proc = spawn(command, clipboardCommand.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdin.write(content);
    proc.stdin.end();

    await new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error(`Clipboard command failed with code ${code}`));
        }
      });
      proc.on('error', reject);
    });

    const sourceFile = basename(sourcePath);
    const sectionInfo = section ? ` (section: ${section})` : '';

    consola.success(
      pc.green(`📋 Copied ${sourceFile}${sectionInfo} to clipboard`),
    );
    consola.info(
      pc.gray(
        `📊 ${content.length} characters, ${content.split('\n').length} lines`,
      ),
    );
  } catch (error) {
    consola.error(pc.red('❌ Failed to copy to clipboard:'), error);

    // Fallback: show content for manual copy
    consola.info(pc.yellow('💡 Manual copy - content below:'));
    console.log(pc.gray('─'.repeat(80)));
    console.log(content);
    console.log(pc.gray('─'.repeat(80)));
  }
};

const copyToFile = async (
  content: string,
  sourcePath: string,
  destination: string,
  isSlashCommand: boolean,
) => {
  try {
    let finalDestination = destination;

    // If destination is a directory, use source filename
    if (destination.endsWith('/') || destination.endsWith('\\')) {
      const sourceFileName = basename(sourcePath);
      finalDestination = join(destination, sourceFileName);
    }

    // Create directory if it doesn't exist
    const destDir = dirname(finalDestination);
    if (!existsSync(destDir)) {
      const { mkdir } = await import('node:fs/promises');
      await mkdir(destDir, { recursive: true });
      consola.info(pc.blue(`📁 Created directory: ${destDir}`));
    }

    // Check if destination exists and prompt for confirmation
    if (existsSync(finalDestination)) {
      consola.warn(
        pc.yellow(`⚠️  Destination file exists: ${finalDestination}`),
      );
      // In a real CLI, you might want to prompt for confirmation here
      // For now, we'll overwrite
    }

    // Write content to destination
    await writeFile(finalDestination, content, 'utf-8');

    const sourceInfo = isSlashCommand
      ? `slash command "${basename(sourcePath, '.md')}"`
      : basename(sourcePath);
    consola.success(pc.green(`📁 Copied ${sourceInfo} to ${finalDestination}`));
    consola.info(
      pc.gray(
        `📊 ${content.length} characters, ${content.split('\n').length} lines`,
      ),
    );

    // Show relative path if it's shorter
    const relativeDest = finalDestination.startsWith(process.cwd())
      ? finalDestination.replace(process.cwd(), '.')
      : finalDestination;

    consola.info(pc.cyan(`🎯 Location: ${relativeDest}`));
  } catch (error) {
    consola.error(pc.red('❌ Failed to copy to file:'), error);
    process.exit(1);
  }
};

// Utility to show available sections in a file (for help)
export const showAvailableSections = async (filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    const sections = extractAllSections(content);

    if (sections.length > 0) {
      console.log(pc.bold(pc.blue('\n📋 Available sections:')));
      for (const section of sections) {
        console.log(`  ${pc.green('•')} ${section}`);
      }
    } else {
      console.log(pc.yellow('No sections found in file'));
    }
  } catch (error) {
    consola.error(pc.red('Failed to read file:'), error);
  }
};

const extractAllSections = (content: string): string[] => {
  const sections: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^#+\s+(.*)$/);

    if (headerMatch) {
      const title = headerMatch[1]?.trim();
      if (title) {
        sections.push(title);
      }
    }
  }

  return sections;
};

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('copyCommand', () => {
    test('should be properly defined', () => {
      expect(copyCommand.name).toBe('copy');
      expect(copyCommand.description).toContain('Copy Claude files');
      expect(copyCommand.args).toBeDefined();
    });

    test('should have required source argument', () => {
      expect(copyCommand.args?.source.required).toBe(true);
      expect(copyCommand.args?.source.type).toBe('string');
    });

    test('should have optional destination arguments', () => {
      expect(copyCommand.args?.to.type).toBe('string');
      expect(copyCommand.args?.clipboard.type).toBe('boolean');
      expect(copyCommand.args?.section.type).toBe('string');
    });
  });

  describe('extractSection', () => {
    test('should extract section by name', () => {
      const content = `# Main Title

## Build Commands
npm run build
npm run test

## Deploy Commands
npm run deploy

## Other Section
Some other content`;

      const result = extractSection(content, 'Build Commands');
      expect(result).toContain('Build Commands');
      expect(result).toContain('npm run build');
      expect(result).toContain('npm run test');
      expect(result).not.toContain('Deploy Commands');
    });

    test('should handle case insensitive search', () => {
      const content = '## Build Commands\nnpm run build';
      const result = extractSection(content, 'build commands');
      expect(result).toContain('Build Commands');
    });

    test('should return null for non-existent section', () => {
      const content = '## Build Commands\nnpm run build';
      const result = extractSection(content, 'Non Existent');
      expect(result).toBeNull();
    });

    test('should handle partial matches', () => {
      const content = '## Build Commands for Production\nnpm run build';
      const result = extractSection(content, 'Build Commands');
      expect(result).toContain('Build Commands for Production');
    });
  });

  describe('extractAllSections', () => {
    test('should extract all header sections', () => {
      const content = `# Main Title
## Section 1
### Subsection 1.1
## Section 2`;

      const sections = extractAllSections(content);
      expect(sections).toEqual([
        'Main Title',
        'Section 1',
        'Subsection 1.1',
        'Section 2',
      ]);
    });

    test('should handle empty content', () => {
      expect(extractAllSections('')).toEqual([]);
      expect(extractAllSections('No headers here')).toEqual([]);
    });
  });
}
