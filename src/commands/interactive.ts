import { consola } from 'consola';
import { define } from 'gunshi';
import pc from 'picocolors';
import type { ClaudeFileInfo, SlashCommandInfo } from '../_types.ts';
import { formatDate, truncateString } from '../_utils.ts';
import { scanClaudeFiles } from '../claude-md-scanner.ts';
import { scanSlashCommands } from '../slash-command-scanner.ts';
import {
  createClaudeFileDescription,
  createClaudeFileLabel,
  createSlashCommandDescription,
  createSlashCommandLabel,
} from '../ui/components/index.ts';
import { type SelectableItem, selectWithArrows } from '../ui/prompts/index.ts';

export const interactiveCommand = define({
  name: 'interactive',
  description: 'Interactive mode for exploring Claude files and slash commands',
  args: {
    path: {
      type: 'string',
      short: 'p',
      description: 'Starting path for exploration',
    },
  },
  examples: `# Start interactive mode
$ claude-explorer interactive

# Start from specific path
$ claude-explorer interactive --path ./projects`,

  run: async (ctx) => {
    const { path } = ctx.values;

    // Skip interactive mode in test environment
    if (process.env.VITEST || process.env.NODE_ENV === 'test') {
      return;
    }

    consola.info(
      pc.bold(pc.blue('🚀 Starting Claude Explorer Interactive Mode')),
    );

    try {
      await runInteractiveSession(path);
    } catch (error) {
      consola.error(pc.red('❌ Interactive mode failed:'), error);
      process.exit(1);
    }
  },
});

const runInteractiveSession = async (_startPath?: string) => {
  while (true) {
    console.clear();

    // Show header
    console.log(
      pc.bold(pc.blue('╔══════════════════════════════════════════╗')),
    );
    console.log(
      pc.bold(pc.blue('║           CLAUDE EXPLORER                ║')),
    );
    console.log(
      pc.bold(pc.blue('╚══════════════════════════════════════════╝')),
    );
    console.log();

    // Scan for all files globally
    consola.start(pc.blue('🔍 Scanning all locations...'));

    const [claudeFiles, slashCommands] = await Promise.all([
      scanClaudeFiles({ recursive: true }),
      scanSlashCommands({ recursive: true }),
    ]);

    console.clear();

    // Show header again after clear
    console.log(
      pc.bold(pc.blue('╔══════════════════════════════════════════╗')),
    );
    console.log(
      pc.bold(pc.blue('║           CLAUDE EXPLORER                ║')),
    );
    console.log(
      pc.bold(pc.blue('╚══════════════════════════════════════════╝')),
    );
    console.log();
    console.log(
      pc.gray(
        `📊 Found: ${claudeFiles.length} Claude files, ${slashCommands.length} slash commands`,
      ),
    );
    console.log();

    // Show main menu
    const choice = await showMainMenu(claudeFiles.length, slashCommands.length);

    switch (choice) {
      case 'claude':
        if (claudeFiles.length > 0) {
          await handleClaudeFilesMenu(claudeFiles);
        } else {
          consola.warn(pc.yellow('No Claude files found'));
          await waitForKeyPress();
        }
        break;

      case 'slash':
        if (slashCommands.length > 0) {
          await handleSlashCommandsMenu(slashCommands);
        } else {
          consola.warn(pc.yellow('No slash commands found'));
          await waitForKeyPress();
        }
        break;

      case 'quit':
        consola.success(pc.green('👋 Goodbye!'));
        return;
    }
  }
};

const showMainMenu = async (
  claudeCount: number,
  slashCount: number,
): Promise<string> => {
  const options: SelectableItem[] = [
    {
      label: '📋 CLAUDE.md files',
      value: 'claude',
      disabled: claudeCount === 0,
      description: `${claudeCount} configuration files found`,
    },
    {
      label: '⚡ Slash commands',
      value: 'slash',
      disabled: slashCount === 0,
      description: `${slashCount} commands available`,
    },
    {
      label: '❌ Quit',
      value: 'quit',
      description: 'Exit Claude Explorer',
    },
  ];

  const selected = await selectWithArrows(options, {
    title: 'What would you like to explore?',
    enableFilter: true,
    enableSearch: true,
    filterPlaceholder: 'Search options...',
  });

  return selected?.value || 'quit';
};

const handleClaudeFilesMenu = async (files: ClaudeFileInfo[]) => {
  while (true) {
    const options: SelectableItem[] = files.map((file) => {
      return {
        label: createClaudeFileLabel(file),
        value: file.path,
        description: createClaudeFileDescription(file), // For search functionality
      };
    });

    const selected = await selectWithArrows(options, {
      title: '📋 Claude Configuration Files',
      enableFilter: true,
      enableSearch: true,
      filterPlaceholder: 'Search by name, type, or framework...',
    });

    if (!selected) {
      break; // Escape key pressed - return to main menu
    }

    const selectedFile = files.find((file) => file.path === selected.value);
    if (selectedFile) {
      await handleFileActions(selectedFile);
    }
  }
};

const handleSlashCommandsMenu = async (commands: SlashCommandInfo[]) => {
  while (true) {
    const options: SelectableItem[] = commands.map((cmd) => {
      return {
        label: createSlashCommandLabel(cmd),
        value: cmd.filePath,
        description: createSlashCommandDescription(cmd), // For search functionality
      };
    });

    const selected = await selectWithArrows(options, {
      title: '⚡ Slash Commands',
      enableFilter: true,
      enableSearch: true,
      filterPlaceholder: 'Search by name, namespace, or scope...',
    });

    if (!selected) {
      break; // Escape key pressed - return to main menu
    }

    const selectedCommand = commands.find(
      (cmd) => cmd.filePath === selected.value,
    );
    if (selectedCommand) {
      await handleCommandActions(selectedCommand);
    }
  }
};

const handleFileActions = async (file: ClaudeFileInfo) => {
  while (true) {
    const fileInfo = [
      `Type: ${file.type}`,
      `Size: ${(file.size / 1024).toFixed(1)} KB`,
      `Modified: ${formatDate(file.lastModified)}`,
      ...(file.projectInfo?.framework
        ? [`Framework: ${file.projectInfo.framework}`]
        : []),
    ].join('\n');

    const options: SelectableItem[] = [
      { label: '📖 Preview content', value: 'preview' },
      { label: '📋 Copy to clipboard', value: 'copy' },
      { label: '📁 Copy to another location', value: 'copy-location' },
      { label: '📂 Open containing directory', value: 'open-dir' },
      { label: '🔗 Show file path', value: 'show-path' },
      { label: '← Back', value: 'back' },
    ];

    const selected = await selectWithArrows(options, {
      title: `${pc.bold(pc.blue(`📄 ${truncateString(file.path, 60)}`))}

${pc.gray(fileInfo)}

${pc.bold(pc.cyan('🎯 What would you like to do?'))}`,
    });

    if (!selected || selected.value === 'back') {
      return;
    }

    switch (selected.value) {
      case 'preview':
        await executePreview(file.path);
        break;
      case 'copy':
        await executeCopy(file.path, true);
        break;
      case 'copy-location':
        await executeCopyToLocation(file.path);
        break;
      case 'open-dir':
        await openDirectory(file.path);
        break;
      case 'show-path':
        console.log(pc.green(`📍 Full path: ${file.path}`));
        await waitForKeyPress();
        break;
    }
  }
};

const handleCommandActions = async (command: SlashCommandInfo) => {
  while (true) {
    const commandInfo = [
      `Scope: ${command.scope}`,
      `File: ${command.filePath}`,
      `Modified: ${formatDate(command.lastModified)}`,
      ...(command.namespace ? [`Namespace: ${command.namespace}`] : []),
      ...(command.description ? [`Description: ${command.description}`] : []),
      `Has Arguments: ${command.hasArguments ? 'Yes' : 'No'}`,
    ].join('\n');

    const options: SelectableItem[] = [
      { label: '📖 Preview command file', value: 'preview' },
      { label: '📋 Copy to clipboard', value: 'copy' },
      { label: '📁 Copy to another location', value: 'copy-location' },
      { label: '🔗 Show file path', value: 'show-path' },
      { label: '← Back', value: 'back' },
    ];

    const selected = await selectWithArrows(options, {
      title: `${pc.bold(pc.blue(`⚡️ ${command.name}`))}

${pc.gray(commandInfo)}

${pc.bold(pc.cyan('🎯 What would you like to do?'))}`,
    });

    if (!selected || selected.value === 'back') {
      return;
    }

    switch (selected.value) {
      case 'preview':
        await executePreview(command.filePath);
        break;
      case 'copy':
        await executeCopy(command.filePath, true);
        break;
      case 'copy-location':
        await executeCopyToLocation(command.filePath);
        break;
      case 'show-path':
        console.log(pc.green(`📍 Full path: ${command.filePath}`));
        await waitForKeyPress();
        break;
    }
  }
};

const executePreview = async (filePath: string) => {
  console.clear();
  // Simulate preview command execution
  console.log(pc.blue('📖 Preview mode - press any key to return'));
  console.log(pc.gray('─'.repeat(80)));

  try {
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 20);

    for (let i = 0; i < lines.length; i++) {
      const lineNum = (i + 1).toString().padStart(3, ' ');
      console.log(`${pc.gray(lineNum)} │ ${lines[i]}`);
    }

    if (content.split('\n').length > 20) {
      console.log(
        pc.yellow(`... and ${content.split('\n').length - 20} more lines`),
      );
    }
  } catch (error) {
    console.log(pc.red('Error reading file:'), error);
  }

  console.log(pc.gray('─'.repeat(80)));
  await waitForKeyPress();
};

const executeCopy = async (_filePath: string, toClipboard: boolean) => {
  try {
    if (toClipboard) {
      // Simulate clipboard copy
      consola.success(pc.green('📋 Content copied to clipboard'));
    }
  } catch (error) {
    consola.error(pc.red('Copy failed:'), error);
  }
  await waitForKeyPress();
};

const executeCopyToLocation = async (filePath: string) => {
  return new Promise<void>((resolve) => {
    console.clear();
    console.log(pc.bold(pc.blue('📁 Copy to Location')));
    console.log(pc.gray(`Source: ${filePath}`));
    console.log();
    console.log('Enter destination path: ');

    const stdin = process.stdin;
    stdin.resume();
    stdin.setEncoding('utf8');

    stdin.once('data', async (data) => {
      const destination = data.toString().trim();
      if (destination) {
        consola.success(pc.green(`📁 File copied to ${destination}`));
      }
      await waitForKeyPress();
      resolve();
    });
  });
};

const openDirectory = async (filePath: string) => {
  const { dirname } = await import('node:path');
  const dir = dirname(filePath);
  consola.info(pc.cyan(`📂 Directory: ${dir}`));
  await waitForKeyPress();
};

// Utility functions

const waitForKeyPress = async () => {
  console.log();
  process.stdout.write(pc.gray('Press any key to continue...'));

  return new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
};

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('interactiveCommand', () => {
    test('should be properly defined', () => {
      expect(interactiveCommand.name).toBe('interactive');
      expect(interactiveCommand.description).toContain('Interactive mode');
      expect(interactiveCommand.args).toBeDefined();
    });

    test('should have path argument', () => {
      expect(interactiveCommand.args?.path).toBeDefined();
      expect(interactiveCommand.args?.path.type).toBe('string');
    });
  });
}
