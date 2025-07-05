import type { ClaudeFileInfo, SlashCommandInfo } from './_types.js';
import { createClaudeFilePath } from './_types.js';

/**
 * テスト用のClaudeFileInfo作成ヘルパー
 */
export const createMockFile = (
  name: string,
  type: ClaudeFileInfo['type'],
  path = `/test/${name}`,
  overrides: Partial<ClaudeFileInfo> = {},
): ClaudeFileInfo => ({
  path: createClaudeFilePath(path),
  type,
  size: 1024,
  lastModified: new Date('2024-01-01'),
  commands: [],
  tags: [],
  ...overrides,
});

/**
 * テスト用のSlashCommandInfo作成ヘルパー
 */
export const createMockSlashCommand = (
  name: string,
  overrides: Partial<SlashCommandInfo> = {},
): SlashCommandInfo => ({
  name,
  scope: 'project',
  description: `Test command: ${name}`,
  hasArguments: false,
  filePath: createClaudeFilePath(`/.claude/commands/${name}.md`),
  lastModified: new Date('2024-01-01'),
  namespace: undefined,
  ...overrides,
});

/**
 * 一般的なファイルセットのプリセット
 */
export const mockFilePresets = {
  basic: (): ClaudeFileInfo[] => [
    createMockFile('CLAUDE.md', 'claude-md'),
    createMockFile('CLAUDE.local.md', 'claude-local-md'),
  ],

  withSlashCommands: (): ClaudeFileInfo[] => [
    createMockFile('CLAUDE.md', 'claude-md'),
    createMockFile('deploy.md', 'slash-command', '/.claude/commands/deploy.md'),
    createMockFile('test.md', 'slash-command', '/.claude/commands/test.md'),
  ],

  globalConfig: (): ClaudeFileInfo[] => [
    createMockFile('CLAUDE.md', 'global-md', '/Users/test/.claude/CLAUDE.md'),
  ],
};

/**
 * モックファイルの内容を生成
 */
export const createMockFileContent = (
  type: 'claude-md' | 'slash-command' | 'markdown',
) => {
  switch (type) {
    case 'claude-md':
      return `# CLAUDE.md

## Project Configuration

This is a test Claude configuration file.

### Development Rules
- Use TypeScript strict mode
- Follow React Ink patterns
`;

    case 'slash-command':
      return `# Deploy Command

Deploys the application to production.

## Usage
\`/deploy [environment]\`

## Arguments
- environment: Target environment (staging, production)
`;

    case 'markdown':
      return `# Test Document

This is a **test** markdown document with *formatting*.

## Features
- Lists
- Code blocks
- **Bold text**
- *Italic text*

\`\`\`typescript
const example = "Hello World";
\`\`\`
`;

    default:
      return 'Mock file content';
  }
};
