import type { FileScanner } from './_types.js';
import { scanClaudeFiles } from './claude-md-scanner.js';
import { scanSlashCommands } from './slash-command-scanner.js';

export const defaultScanner: FileScanner = {
  scanClaudeFiles,
  scanSlashCommands,
} as const;
