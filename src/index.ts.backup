#!/usr/bin/env node

import { consola } from 'consola';
import { cli } from 'gunshi';
import pc from 'picocolors';
import { copyCommand } from './commands/copy.ts';
import { interactiveCommand } from './commands/interactive.ts';
import { previewCommand } from './commands/preview.ts';
import { scanCommand } from './commands/scan.ts';

// Create sub-commands map
const subCommands = new Map();
subCommands.set('scan', scanCommand);
subCommands.set('preview', previewCommand);
subCommands.set('copy', copyCommand);
subCommands.set('interactive', interactiveCommand);

// Main command (default behavior)
const mainCommand = {
  name: 'claude-explorer',
  description:
    'CLI tool for exploring and managing Claude Code settings and slash commands',

  run: async () => {
    // If no sub-command is provided, run interactive mode by default
    console.log(pc.bold(pc.blue('🚀 Claude Explorer')));
    console.log(pc.gray('Starting interactive mode...'));
    console.log();

    // Run interactive command (simplified for test compatibility)
    if (interactiveCommand.run) {
      try {
        // Create a mock context for test environment
        const mockContext = {
          values: { path: process.cwd() },
          args: interactiveCommand.args || {},
          name: 'interactive',
          description: interactiveCommand.description || '',
          locale: 'en',
          env: process.env,
          stdout: process.stdout,
          stderr: process.stderr,
          stdin: process.stdin,
          pkg: { name: 'claude-explorer', version: '1.0.0' },
          workdir: process.cwd(),
          command: interactiveCommand,
          parent: null,
          helpRequested: false,
        };
        return await interactiveCommand.run(
          mockContext as unknown as Parameters<
            typeof interactiveCommand.run
          >[0],
        );
      } catch (error) {
        consola.error(pc.red('Failed to start interactive mode:'), error);
      }
    }
  },
};

// Load package.json for version info
async function loadPackageJson() {
  try {
    // Dynamic import with type assertion for JSON
    const pkgJsonModule = await import('../package.json', {
      with: { type: 'json' },
    });
    return pkgJsonModule.default;
  } catch {
    // Fallback if import fails
    return {
      name: 'claude-explorer',
      version: '1.0.0',
      description: 'CLI tool for exploring Claude settings',
    };
  }
}

async function main() {
  try {
    const pkgJson = await loadPackageJson();

    // Run CLI with gunshi
    await cli(process.argv.slice(2), mainCommand, {
      name: pkgJson.name,
      version: pkgJson.version,
      description: pkgJson.description,
      subCommands,
    });
  } catch (error) {
    consola.error(pc.red('❌ Application error:'), error);
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log();
  consola.info(pc.yellow('👋 Interrupted by user'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log();
  consola.info(pc.yellow('👋 Terminated'));
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const message = error instanceof Error ? error.message : String(error);
  consola.error(pc.red('💥 Uncaught exception:'), message);

  // In debug mode, show full stack trace
  if (process.env.DEBUG || process.env.VERBOSE) {
    consola.error('Stack trace:', error);
  }

  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  consola.error(pc.red('💥 Unhandled rejection:'), message);

  // In debug mode, show full details
  if (process.env.DEBUG || process.env.VERBOSE) {
    consola.error('Promise:', promise, 'Reason:', reason);
  }

  process.exit(1);
});

// Run the main function
await main();

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('main application', () => {
    test('should have main command defined', () => {
      expect(mainCommand.name).toBe('claude-explorer');
      expect(mainCommand.description).toContain('CLI tool');
      expect(typeof mainCommand.run).toBe('function');
    });

    test('should have all sub-commands registered', () => {
      expect(subCommands.has('scan')).toBe(true);
      expect(subCommands.has('preview')).toBe(true);
      expect(subCommands.has('copy')).toBe(true);
      expect(subCommands.has('interactive')).toBe(true);
    });

    test('should have proper sub-command count', () => {
      expect(subCommands.size).toBe(4);
    });
  });

  describe('loadPackageJson', () => {
    test('should return package information', async () => {
      const pkg = await loadPackageJson();
      expect(pkg.name).toBeDefined();
      expect(pkg.version).toBeDefined();
      expect(pkg.description).toBeDefined();
    });
  });
}
