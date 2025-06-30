import Table from 'cli-table3';
import { consola } from 'consola';
import { define } from 'gunshi';
import pc from 'picocolors';
import { scanArgs } from '../_shared-args.ts';
import type {
  ClaudeFileInfo,
  ClaudeFileType,
  ScanOptions,
  SlashCommandInfo,
} from '../_types.ts';
import {
  formatDate,
  formatFileSize,
  getRelativePath,
  truncateString,
} from '../_utils.ts';
import { scanClaudeFiles } from '../claude-md-scanner.ts';
import { scanSlashCommands } from '../slash-command-scanner.ts';

export const scanCommand = define({
  name: 'scan',
  description: 'Scan for Claude configuration files and slash commands',
  args: scanArgs,
  examples: `# Scan current directory
$ claude-explorer scan

# Scan specific path recursively  
$ claude-explorer scan --path ./projects --recursive

# Scan only CLAUDE.md files
$ claude-explorer scan --type claude-md

# Output as JSON
$ claude-explorer scan --output json

# Include hidden files
$ claude-explorer scan --include-hidden`,

  run: async (ctx) => {
    const { path, recursive, type, output, includeHidden, verbose } =
      ctx.values;

    consola.start(pc.blue('🔍 Scanning for Claude files...'));

    try {
      const options: ScanOptions = {
        path,
        recursive,
        type: type as ClaudeFileType | undefined, // Type assertion for CLI string to enum
        includeHidden,
      };

      if (verbose) {
        consola.info('Scan options:', options);
      }

      // Scan based on type or scan all if no type specified
      let claudeFiles: ClaudeFileInfo[] = [];
      let slashCommands: SlashCommandInfo[] = [];

      if (
        !type ||
        type === 'claude-md' ||
        type === 'claude-local-md' ||
        type === 'global-md'
      ) {
        claudeFiles = await scanClaudeFiles(options);
      }

      if (!type || type === 'slash-command') {
        slashCommands = await scanSlashCommands(options);
      }

      // Output results
      if (output === 'json') {
        console.log(
          JSON.stringify(
            {
              claudeFiles,
              slashCommands,
              summary: {
                totalClaudeFiles: claudeFiles.length,
                totalSlashCommands: slashCommands.length,
                scanPath: path || process.cwd(),
                scanTime: new Date().toISOString(),
              },
            },
            null,
            2,
          ),
        );
      } else {
        displayTableResults(claudeFiles, slashCommands, {
          path,
          verbose: Boolean(verbose),
        });
      }

      consola.success(
        pc.green(
          `✅ Scan complete! Found ${claudeFiles.length} Claude files and ${slashCommands.length} slash commands`,
        ),
      );
    } catch (error) {
      consola.error(pc.red('❌ Scan failed:'), error);
      process.exit(1);
    }
  },
});

const displayTableResults = (
  claudeFiles: ClaudeFileInfo[],
  slashCommands: SlashCommandInfo[],
  options: { path?: string | undefined; verbose: boolean },
) => {
  const basePath = options.path || process.cwd();

  // Display Claude files table
  if (claudeFiles.length > 0) {
    console.log(pc.bold(pc.blue('\n📋 Claude Configuration Files:')));

    const claudeTable = new Table({
      head: ['Path', 'Type', 'Size', 'Modified', 'Framework', 'Commands'].map(
        (h) => pc.cyan(h),
      ),
      colWidths: [40, 15, 10, 16, 15, 12],
      wordWrap: true,
    });

    for (const file of claudeFiles) {
      const relativePath = getRelativePath(file.path, basePath);
      const framework = file.projectInfo?.framework || '-';
      const commandCount = file.commands.length;

      claudeTable.push([
        truncateString(relativePath, 35),
        getTypeColor(file.type),
        formatFileSize(file.size),
        formatDate(file.lastModified),
        truncateString(framework, 12),
        commandCount > 0 ? pc.green(commandCount.toString()) : pc.gray('0'),
      ]);
    }

    console.log(claudeTable.toString());

    if (options.verbose) {
      displayDetailedClaudeInfo(claudeFiles);
    }
  }

  // Display slash commands table
  if (slashCommands.length > 0) {
    console.log(pc.bold(pc.blue('\n⚡️ Slash Commands:')));

    const commandTable = new Table({
      head: [
        'Command',
        'Scope',
        'Namespace',
        'Description',
        'Arguments',
        'Modified',
      ].map((h) => pc.cyan(h)),
      colWidths: [20, 8, 12, 35, 8, 16],
      wordWrap: true,
    });

    for (const command of slashCommands) {
      const scopeColor = command.scope === 'user' ? pc.blue : pc.green;
      const hasArgsIcon = command.hasArguments ? pc.yellow('📝') : pc.gray('-');

      commandTable.push([
        pc.white(command.name),
        scopeColor(command.scope),
        command.namespace || pc.gray('-'),
        truncateString(command.description || '', 30),
        hasArgsIcon,
        formatDate(command.lastModified),
      ]);
    }

    console.log(commandTable.toString());
  }

  // Display summary
  displaySummary(claudeFiles, slashCommands);
};

const displayDetailedClaudeInfo = (claudeFiles: ClaudeFileInfo[]) => {
  console.log(pc.bold(pc.yellow('\n📊 Detailed Information:')));

  for (const file of claudeFiles.slice(0, 3)) {
    // Show details for first 3 files
    console.log(`\n${pc.bold(file.path)}`);

    if (file.projectInfo?.framework) {
      console.log(`  Framework: ${pc.green(file.projectInfo.framework)}`);
    }

    if (file.projectInfo?.language) {
      console.log(`  Language: ${pc.blue(file.projectInfo.language)}`);
    }

    if (file.tags.length > 0) {
      console.log(
        `  Tags: ${file.tags.map((tag) => pc.magenta(`#${tag}`)).join(', ')}`,
      );
    }

    if (file.commands.length > 0) {
      console.log(
        `  Commands: ${file.commands.map((cmd) => pc.cyan(cmd.name)).join(', ')}`,
      );
    }
  }
};

const displaySummary = (
  claudeFiles: ClaudeFileInfo[],
  slashCommands: SlashCommandInfo[],
) => {
  console.log(pc.bold(pc.yellow('\n📈 Summary:')));

  const summary = new Table({
    head: ['Metric', 'Count'].map((h) => pc.cyan(h)),
    colWidths: [25, 10],
  });

  summary.push(
    [
      'Claude.md files',
      pc.green(
        claudeFiles.filter((f) => f.type === 'claude-md').length.toString(),
      ),
    ],
    [
      'Claude.local.md files',
      pc.blue(
        claudeFiles
          .filter((f) => f.type === 'claude-local-md')
          .length.toString(),
      ),
    ],
    [
      'Global configs',
      pc.magenta(
        claudeFiles.filter((f) => f.type === 'global-md').length.toString(),
      ),
    ],
    ['Slash commands', pc.yellow(slashCommands.length.toString())],
    [
      'Project commands',
      pc.green(
        slashCommands.filter((c) => c.scope === 'project').length.toString(),
      ),
    ],
    [
      'User commands',
      pc.blue(
        slashCommands.filter((c) => c.scope === 'user').length.toString(),
      ),
    ],
  );

  console.log(summary.toString());

  // Framework breakdown
  const frameworks = new Map<string, number>();
  for (const file of claudeFiles) {
    if (file.projectInfo?.framework) {
      const count = frameworks.get(file.projectInfo.framework) || 0;
      frameworks.set(file.projectInfo.framework, count + 1);
    }
  }

  if (frameworks.size > 0) {
    console.log(pc.bold(pc.cyan('\n🏗️  Frameworks Found:')));
    for (const [framework, count] of frameworks.entries()) {
      console.log(
        `  ${pc.green(framework)}: ${count} project${count === 1 ? '' : 's'}`,
      );
    }
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'claude-md':
      return pc.green(type);
    case 'claude-local-md':
      return pc.blue(type);
    case 'global-md':
      return pc.magenta(type);
    case 'slash-command':
      return pc.yellow(type);
    default:
      return pc.gray(type);
  }
};

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('scanCommand', () => {
    test('should be properly defined', () => {
      expect(scanCommand.name).toBe('scan');
      expect(scanCommand.description).toContain('Scan for Claude');
      expect(scanCommand.args).toBeDefined();
    });

    test('should have proper argument definitions', () => {
      expect(scanCommand.args?.path).toBeDefined();
      expect(scanCommand.args?.recursive).toBeDefined();
      expect(scanCommand.args?.type).toBeDefined();
      expect(scanCommand.args?.output).toBeDefined();
    });
  });

  describe('getTypeColor', () => {
    test('should return colored type strings', () => {
      expect(getTypeColor('claude-md')).toContain('claude-md');
      expect(getTypeColor('claude-local-md')).toContain('claude-local-md');
      expect(getTypeColor('global-md')).toContain('global-md');
      expect(getTypeColor('slash-command')).toContain('slash-command');
    });
  });
}
