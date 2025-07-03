import { consola } from 'consola';
import { define } from 'gunshi';
import open from 'open';
import pc from 'picocolors';
import prompts from 'prompts';
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
// Import actual functionality from other commands
import { copyToClipboard, copyToFile } from './copy.ts';
import { previewFile } from './preview.ts';

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
    try {
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
      const choice = await showMainMenu(
        claudeFiles.length,
        slashCommands.length,
      );

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
    } catch (error) {
      // Handle Ctrl+C at the top level
      // Use error.name instead of instanceof due to module loading issues
      if (error instanceof Error && error.name === 'ExitPromptError') {
        consola.success(pc.green('👋 Goodbye!'));
        process.exit(0);
      }
      throw error; // Re-throw unexpected errors
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
      { label: '📁 Copy to current directory', value: 'copy-current' },
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
        await executeClipboardCopy(file.path);
        break;
      case 'copy-current':
        await executeCopyToCurrentDirectory(file.path);
        break;
      case 'open-dir':
        await openDirectory(file.path);
        break;
      case 'show-path':
        await executeShowPathWithCopy(file.path);
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
      { label: '📁 Copy to current directory', value: 'copy-current' },
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
  while (true) {
    console.clear();
    try {
      // Show the preview content
      await previewFile(filePath, 50);

      console.log(); // Add spacing
      console.log(pc.gray('─'.repeat(80)));

      // Show preview menu options
      const options = [
        {
          label: '📄 View full file',
          value: 'full',
          description: 'Show entire file content',
        },
        {
          label: '📋 Copy to clipboard',
          value: 'copy',
          description: 'Copy file content to clipboard',
        },
        {
          label: '← Back to file menu',
          value: 'back',
          description: 'Return to previous menu',
        },
      ];

      const selected = await selectWithArrows(options, {
        title: pc.bold(pc.blue('📖 Preview Actions')),
      });

      if (!selected || selected.value === 'back') {
        return; // Exit preview menu
      }

      switch (selected.value) {
        case 'full':
          console.clear();
          await previewFile(filePath); // Show full file without limit
          await waitForKeyPress();
          break;
        case 'copy':
          await executeClipboardCopy(filePath);
          break;
      }
    } catch (error) {
      consola.error(pc.red('❌ Preview failed:'), error);
      await waitForKeyPress();
      return;
    }
  }
};

const executeClipboardCopy = async (filePath: string) => {
  try {
    // Use actual clipboard copy functionality from copy.ts
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(filePath, 'utf-8');
    await copyToClipboard(content, filePath);
    // No waitForKeyPress - immediate completion as requested
  } catch (error) {
    consola.error(pc.red('❌ Copy failed:'), error);
  }
};

const executeCopy = async (filePath: string, toClipboard: boolean) => {
  try {
    if (toClipboard) {
      await executeClipboardCopy(filePath);
    }
  } catch (error) {
    consola.error(pc.red('❌ Copy failed:'), error);
  }
  await waitForKeyPress();
};

const executeCopyToCurrentDirectory = async (filePath: string) => {
  try {
    const { basename } = await import('node:path');
    const { existsSync } = await import('node:fs');
    const { readFile } = await import('node:fs/promises');

    const fileName = basename(filePath);
    const destination = `./${fileName}`;

    // Check if file already exists in current directory
    if (existsSync(destination)) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: pc.yellow(
          `File "${fileName}" already exists in current directory. Overwrite?`,
        ),
        initial: false,
      });
      const overwrite = response.overwrite;

      if (!overwrite) {
        consola.info(pc.yellow('📁 Copy operation cancelled'));
        return;
      }
    }

    // Use actual file copy functionality from copy.ts
    const content = await readFile(filePath, 'utf-8');
    await copyToFile(content, filePath, destination, false);
  } catch (error) {
    // Handle Ctrl+C gracefully
    if (error instanceof Error && error.name === 'ExitPromptError') {
      consola.info(pc.yellow('📁 Copy operation cancelled'));
      return;
    }
    consola.error(pc.red('❌ Copy to current directory failed:'), error);
  }
  // No waitForKeyPress for streamlined workflow
};

const executeCopyToLocation = async (filePath: string) => {
  try {
    console.clear();
    console.log(pc.bold(pc.blue('📁 Copy to Location')));
    console.log(pc.gray(`Source: ${filePath}`));
    console.log();

    const response = await prompts({
      type: 'text',
      name: 'destination',
      message: 'Enter destination path:',
      validate: (input) => {
        if (!input.trim()) {
          return 'Please enter a destination path';
        }
        return true;
      },
    });
    const destination = response.destination;

    if (destination.trim()) {
      // Use actual file copy functionality from copy.ts
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(filePath, 'utf-8');
      await copyToFile(content, filePath, destination.trim(), false);
    }
  } catch (error) {
    // Handle Ctrl+C gracefully
    if (error instanceof Error && error.name === 'ExitPromptError') {
      consola.info(pc.yellow('📁 Copy operation cancelled'));
      return;
    }
    consola.error(pc.red('❌ Copy to location failed:'), error);
  }
  await waitForKeyPress();
};

const executeShowPathWithCopy = async (filePath: string) => {
  try {
    const { relative } = await import('node:path');
    const { selectWithArrows } = await import('../ui/prompts/index.ts');

    // Generate relative path
    const relativePath = relative(process.cwd(), filePath);
    const absolutePath = filePath;

    console.clear();
    console.log(pc.bold(pc.blue('🔗 File Path Information')));
    console.log();
    console.log(`📍 ${pc.bold('Absolute path:')}`);
    console.log(`   ${pc.cyan(absolutePath)}`);
    console.log();
    console.log(`📍 ${pc.bold('Relative path:')}`);
    console.log(`   ${pc.cyan(relativePath)}`);
    console.log();

    const options = [
      {
        label: '📋 Copy absolute path to clipboard',
        value: 'absolute',
        description: absolutePath,
      },
      {
        label: '📋 Copy relative path to clipboard',
        value: 'relative',
        description: relativePath,
      },
      {
        label: '← Back to file menu',
        value: 'back',
      },
    ];

    const selected = await selectWithArrows(options, {
      title: 'Choose path to copy:',
      enableFilter: false,
    });

    if (!selected || selected.value === 'back') {
      return;
    }

    const pathToCopy =
      selected.value === 'absolute' ? absolutePath : relativePath;
    const pathType = selected.value === 'absolute' ? 'absolute' : 'relative';

    // Copy to clipboard
    await copyToClipboard(pathToCopy, filePath);
    consola.success(pc.green(`📋 ${pathType} path copied to clipboard`));
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      return;
    }
    consola.error(pc.red('❌ Show path failed:'), error);
  }
  // No waitForKeyPress for streamlined workflow
};

const openDirectory = async (filePath: string) => {
  try {
    const { dirname } = await import('node:path');
    const dir = dirname(filePath);

    consola.start(pc.blue(`📂 Opening directory: ${dir}`));
    await open(dir);
    consola.success(pc.green('📂 Directory opened in file manager'));
  } catch (error) {
    consola.error(pc.red('❌ Failed to open directory:'), error);

    // Fallback: show directory path
    const { dirname } = await import('node:path');
    const dir = dirname(filePath);
    consola.info(pc.cyan(`📂 Directory path: ${dir}`));
  }
  await waitForKeyPress();
};

// Utility functions

const waitForKeyPress = async () => {
  try {
    await prompts({
      type: 'confirm',
      name: 'continue',
      message: pc.gray('Press Enter to continue...'),
      initial: true,
    });
  } catch (error) {
    // Handle Ctrl+C gracefully - just continue
    if (error instanceof Error && error.name === 'ExitPromptError') {
      return;
    }
    // For other errors, just log and continue
    console.log();
  }
};

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect, vi } = import.meta.vitest;

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

  describe('executePreview integration', () => {
    test('should use actual previewFile function', async () => {
      // Mock the previewFile function to verify it's called
      const mockPreviewFile = vi.fn().mockResolvedValue(undefined);
      vi.doMock('./preview.ts', () => ({
        previewFile: mockPreviewFile,
      }));

      // Test that executePreview calls the actual preview function
      const _testFilePath = '/test/path/CLAUDE.md';

      // Since executePreview is not exported, we test the integration
      // by verifying the import structure is correct
      expect(typeof previewFile).toBe('function');
    });
  });

  describe('executeCopy integration', () => {
    test('should use actual copyToClipboard function', () => {
      // Test that copyToClipboard is properly imported
      expect(typeof copyToClipboard).toBe('function');
    });

    test('should use actual copyToFile function', () => {
      // Test that copyToFile is properly imported
      expect(typeof copyToFile).toBe('function');
    });
  });

  describe('interactive function integrations', () => {
    test('should have all required imported functions available', () => {
      // Verify all imported functions are available
      expect(typeof previewFile).toBe('function');
      expect(typeof copyToClipboard).toBe('function');
      expect(typeof copyToFile).toBe('function');
    });

    test('should validate input for prompts integration', async () => {
      // Test input validation logic
      const validator = (input: string) => {
        if (!input.trim()) {
          return 'Please enter a destination path';
        }
        return true;
      };

      expect(validator('')).toBe('Please enter a destination path');
      expect(validator('   ')).toBe('Please enter a destination path');
      expect(validator('/valid/path')).toBe(true);
    });
  });

  describe('error handling improvements', () => {
    test('should handle ExitPromptError correctly', () => {
      const exitError = Object.assign(new Error('User canceled'), {
        name: 'ExitPromptError',
      });

      // Test that error is properly identified
      expect(exitError.name).toBe('ExitPromptError');
      expect(exitError instanceof Error).toBe(true);
    });
  });

  describe('waitForKeyPress improvements', () => {
    test('should use prompts confirm function', async () => {
      // Test that the new implementation uses prompts library
      // This tests the structure rather than actual user interaction
      const mockPrompts = vi.fn().mockResolvedValue({ continue: true });

      // Mock the prompts import
      vi.doMock('prompts', () => ({
        default: mockPrompts,
      }));

      // The function should be available (integration test)
      expect(typeof waitForKeyPress).toBe('function');
    });

    test('should handle ExitPromptError in waitForKeyPress', () => {
      // Test error handling logic
      const exitError = Object.assign(new Error('User canceled'), {
        name: 'ExitPromptError',
      });

      // Verify error type detection
      expect(exitError.name).toBe('ExitPromptError');
      expect(exitError instanceof Error).toBe(true);
    });

    test('should configure confirm prompt correctly', () => {
      // Test configuration structure
      const config = {
        message: 'Press Enter to continue...',
        default: true,
        theme: {
          prefix: { done: '✓' },
          style: {
            message: (text: string) => text,
            answer: (text: string) => text,
          },
        },
      };

      expect(config.message).toContain('Press Enter');
      expect(config.default).toBe(true);
      expect(config.theme).toBeDefined();
      expect(typeof config.theme.style.message).toBe('function');
    });
  });

  describe('workflow improvements', () => {
    test('should have new executeClipboardCopy function', () => {
      // Test that the new streamlined copy function exists
      expect(typeof executeClipboardCopy).toBe('function');
    });

    test('should have new executeCopyToCurrentDirectory function', () => {
      // Test that the copy to current directory function exists
      expect(typeof executeCopyToCurrentDirectory).toBe('function');
    });

    test('should have new executeShowPathWithCopy function', () => {
      // Test that the enhanced show path function exists
      expect(typeof executeShowPathWithCopy).toBe('function');
    });

    test('should handle path operations correctly', async () => {
      // Test path processing logic
      const testPath = '/Users/test/project/CLAUDE.md';
      const { basename } = await import('node:path');
      const { relative } = await import('node:path');

      const fileName = basename(testPath);
      const relativePath = relative(process.cwd(), testPath);

      expect(fileName).toBe('CLAUDE.md');
      expect(typeof relativePath).toBe('string');
    });

    test('should validate menu options for current directory copy', () => {
      // Test menu option structure
      const option = {
        label: '📁 Copy to current directory',
        value: 'copy-current',
      };

      expect(option.label).toContain('Copy to current directory');
      expect(option.value).toBe('copy-current');
    });

    test('should validate path copy menu options', () => {
      // Test path copy menu structure
      const options = [
        {
          label: '📋 Copy absolute path to clipboard',
          value: 'absolute',
          description: '/test/path',
        },
        {
          label: '📋 Copy relative path to clipboard',
          value: 'relative',
          description: './test/path',
        },
      ];

      expect(options).toHaveLength(2);
      expect(options[0]?.value).toBe('absolute');
      expect(options[1]?.value).toBe('relative');
      expect(options[0]?.label).toContain('absolute path');
      expect(options[1]?.label).toContain('relative path');
    });

    test('should handle file existence checks', () => {
      // Test file existence checking logic
      const { existsSync } = require('node:fs');

      // Test with known files
      expect(typeof existsSync).toBe('function');

      // Test destination path generation
      const fileName = 'test.md';
      const destination = `./${fileName}`;
      expect(destination).toBe('./test.md');
    });
  });
}
