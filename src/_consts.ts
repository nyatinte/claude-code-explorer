import { homedir } from 'node:os';
import { join } from 'node:path';

// Claude file patterns
export const CLAUDE_FILE_PATTERNS = {
  CLAUDE_MD: '**/CLAUDE.md',
  CLAUDE_LOCAL_MD: '**/CLAUDE.local.md',
  GLOBAL_CLAUDE_MD: join(homedir(), '.claude', 'CLAUDE.md'),
  PROJECT_SLASH_COMMANDS: '**/.claude/commands/**/*.md',
  USER_SLASH_COMMANDS: join(homedir(), '.claude', 'commands', '**', '*.md'),
} as const;

// Removed unused DEFAULT_SEARCH_PATHS

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  MAX_CLAUDE_MD_SIZE: 1024 * 1024, // 1MB
  MAX_SLASH_COMMAND_SIZE: 512 * 1024, // 512KB
} as const;

// CLI output configuration
const _OUTPUT_CONFIG = {
  DEFAULT_TABLE_WIDTH: 120,
  MAX_DESCRIPTION_LENGTH: 80,
  MAX_PATH_LENGTH: 60,
} as const;

// Common file extensions for project detection
export const PROJECT_INDICATORS = {
  PACKAGE_JSON: 'package.json',
  CARGO_TOML: 'Cargo.toml',
  PYPROJECT_TOML: 'pyproject.toml',
  GEMFILE: 'Gemfile',
  GO_MOD: 'go.mod',
} as const;

// Framework detection patterns
export const FRAMEWORK_PATTERNS = {
  'Next.js': ['next.config.js', 'next.config.ts', 'pages/', 'app/'],
  React: ['src/App.jsx', 'src/App.tsx', 'public/index.html'],
  'Vue.js': ['vue.config.js', 'src/main.js', 'src/App.vue'],
  Express: ['app.js', 'server.js', 'express'],
  FastAPI: ['main.py', 'fastapi'],
  Django: ['manage.py', 'settings.py'],
  'Ruby on Rails': ['Gemfile', 'config/application.rb'],
} as const;

// Package manager commands
export const PACKAGE_MANAGER_COMMANDS = {
  NPM_RUN: 'npm run',
  BUN_RUN: 'bun run',
  PNPM_RUN: 'pnpm run',
  YARN_RUN: 'yarn run',
} as const;

// Script patterns for detection
export const SCRIPT_PATTERNS = {
  BUILD: 'build',
  TEST: 'test',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FILE_NOT_FOUND: 'File not found',
  INVALID_PATH: 'Invalid path provided',
  PERMISSION_DENIED: 'Permission denied',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FORMAT: 'Invalid file format',
  PACKAGE_JSON_PARSE_ERROR: 'Failed to parse package.json',
} as const;

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('CLAUDE_FILE_PATTERNS', () => {
    test('should contain expected patterns', () => {
      expect(CLAUDE_FILE_PATTERNS.CLAUDE_MD).toBe('**/CLAUDE.md');
      expect(CLAUDE_FILE_PATTERNS.CLAUDE_LOCAL_MD).toBe('**/CLAUDE.local.md');
      expect(CLAUDE_FILE_PATTERNS.PROJECT_SLASH_COMMANDS).toBe(
        '**/.claude/commands/**/*.md',
      );
    });

    test('should include home directory paths', () => {
      expect(CLAUDE_FILE_PATTERNS.GLOBAL_CLAUDE_MD).toContain('.claude');
      expect(CLAUDE_FILE_PATTERNS.USER_SLASH_COMMANDS).toContain(
        '.claude/commands',
      );
    });
  });

  // Removed DEFAULT_SEARCH_PATHS tests (no longer exported)

  describe('FILE_SIZE_LIMITS', () => {
    test('should have reasonable size limits', () => {
      expect(FILE_SIZE_LIMITS.MAX_CLAUDE_MD_SIZE).toBe(1024 * 1024);
      expect(FILE_SIZE_LIMITS.MAX_SLASH_COMMAND_SIZE).toBe(512 * 1024);
    });
  });

  describe('FRAMEWORK_PATTERNS', () => {
    test('should contain framework detection patterns', () => {
      expect(FRAMEWORK_PATTERNS['Next.js']).toContain('next.config.js');
      expect(FRAMEWORK_PATTERNS.React).toContain('src/App.jsx');
      expect(FRAMEWORK_PATTERNS['Vue.js']).toContain('vue.config.js');
    });
  });
}
