import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { match, P } from 'ts-pattern';
import {
  ERROR_MESSAGES,
  FRAMEWORK_PATTERNS,
  PACKAGE_MANAGER_COMMANDS,
  PROJECT_INDICATORS,
  SCRIPT_PATTERNS,
} from './_consts.ts';
import type { ClaudeFilePath, ClaudeFileType, ProjectInfo } from './_types.ts';
import { safeCreateClaudeFilePath } from './_types.ts';

// File path utilities
export const parseSlashCommandName = (fileName: string): string => {
  return fileName.replace(/\.md$/, '').replace(/\//g, ':');
};

const normalizeFilePath = (filePath: string): ClaudeFilePath => {
  const normalized = filePath.startsWith('~')
    ? filePath.replace('~', homedir())
    : filePath;

  const claudePath = safeCreateClaudeFilePath(normalized);
  if (!claudePath) {
    throw new Error(`Invalid file path: ${filePath}`);
  }

  return claudePath;
};

export const getFileScope = (filePath: string): 'project' | 'user' => {
  return filePath.includes(homedir()) ? 'user' : 'project';
};

// File type detection
export const detectClaudeFileType = (filePath: string): ClaudeFileType => {
  const fileName = basename(filePath);
  const dirPath = dirname(filePath);

  return match([fileName, dirPath])
    .with(['CLAUDE.md', P._], () => 'claude-md' as const)
    .with(['CLAUDE.local.md', P._], () => 'claude-local-md' as const)
    .with(
      [P._, P.when((dir) => dir.includes('.claude/CLAUDE.md'))],
      () => 'global-md' as const,
    )
    .with(
      [
        P.when((name) => name.endsWith('.md')),
        P.when((dir) => dir.includes('.claude/commands')),
      ],
      () => 'slash-command' as const,
    )
    .otherwise(() => 'unknown' as const);
};

// Content validation
export const validateClaudeMdContent = (content: string): boolean => {
  // Allow any content - validation should be minimal for flexibility
  return content.length >= 0;
};

export const extractTagsFromContent = (content: string): string[] => {
  const tagPattern = /#(\w+)/g;
  const matches = content.match(tagPattern);
  return matches ? matches.map((tag) => tag.slice(1)) : [];
};

export const extractCommandsFromContent = (
  content: string,
): Array<{
  name: string;
  description?: string | undefined;
  hasArguments: boolean;
}> => {
  // Extract slash commands from markdown content
  const commandPattern = /\/(\w+)(?:\s+(.+?))?$/gm;
  const commands: Array<{
    name: string;
    description?: string | undefined;
    hasArguments: boolean;
  }> = [];

  let match: RegExpExecArray | null = commandPattern.exec(content);
  while (match !== null) {
    const [, name, description] = match;
    if (!name) {
      match = commandPattern.exec(content);
      continue;
    }
    commands.push({
      name,
      description: description?.trim(),
      hasArguments: Boolean(
        description?.includes('<') || description?.includes('['),
      ),
    });
    match = commandPattern.exec(content);
  }

  return commands;
};

// Project analysis
export const analyzeProjectInfo = async (
  directoryPath: string,
): Promise<ProjectInfo> => {
  try {
    const { readFile } = await import('node:fs/promises');
    const { existsSync } = await import('node:fs');

    let projectInfo: ProjectInfo = {};

    // Check for package.json
    const packageJsonPath = join(
      directoryPath,
      PROJECT_INDICATORS.PACKAGE_JSON,
    );
    if (existsSync(packageJsonPath)) {
      try {
        const packageContent = await readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageContent);

        projectInfo = {
          ...projectInfo,
          language: 'JavaScript/TypeScript',
          dependencies: Object.keys(packageJson.dependencies || {}),
        };

        if (packageJson.scripts) {
          projectInfo = {
            ...projectInfo,
            buildCommands: Object.keys(packageJson.scripts)
              .filter((script) => script.includes(SCRIPT_PATTERNS.BUILD))
              .map((script) => `${PACKAGE_MANAGER_COMMANDS.NPM_RUN} ${script}`),
            testCommands: Object.keys(packageJson.scripts)
              .filter((script) => script.includes(SCRIPT_PATTERNS.TEST))
              .map((script) => `${PACKAGE_MANAGER_COMMANDS.NPM_RUN} ${script}`),
          };
        }

        // Detect framework
        for (const [framework, patterns] of Object.entries(
          FRAMEWORK_PATTERNS,
        )) {
          const hasFramework = patterns.some((pattern) => {
            if (pattern.endsWith('/')) {
              return existsSync(join(directoryPath, pattern));
            }
            return (
              existsSync(join(directoryPath, pattern)) ||
              projectInfo.dependencies?.includes(pattern.toLowerCase())
            );
          });

          if (hasFramework) {
            projectInfo = { ...projectInfo, framework };
            break;
          }
        }
      } catch (error) {
        // Log parsing errors in debug mode
        console.debug(ERROR_MESSAGES.PACKAGE_JSON_PARSE_ERROR, error);
        projectInfo = { ...projectInfo, isIncomplete: true };
      }
    }

    return projectInfo;
  } catch (error) {
    console.debug('Failed to analyze project info:', error);
    return { isIncomplete: true };
  }
};

// String utilities

// InSource tests
if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('parseSlashCommandName', () => {
    test('should convert file path to command name', () => {
      expect(parseSlashCommandName('deploy.md')).toBe('deploy');
      expect(parseSlashCommandName('frontend/component.md')).toBe(
        'frontend:component',
      );
    });

    test('should handle nested paths correctly', () => {
      expect(parseSlashCommandName('git/commit.md')).toBe('git:commit');
      expect(parseSlashCommandName('project/test/unit.md')).toBe(
        'project:test:unit',
      );
    });
  });

  describe('validateClaudeMdContent', () => {
    test('should validate valid CLAUDE.md content', () => {
      expect(validateClaudeMdContent('# Project Info\n## Setup')).toBe(true);
      expect(validateClaudeMdContent('## Build Commands')).toBe(true);
    });

    test('should accept any reasonable content', () => {
      expect(validateClaudeMdContent('Just plain text')).toBe(true);
      expect(validateClaudeMdContent('')).toBe(true);
      expect(validateClaudeMdContent('- bullet point\n- another')).toBe(true);
    });

    test('should accept any content size', () => {
      const largeContent = 'x'.repeat(1000000); // 1MB
      expect(validateClaudeMdContent(largeContent)).toBe(true);
    });
  });

  describe('detectClaudeFileType', () => {
    test('should detect CLAUDE.md files', () => {
      expect(detectClaudeFileType('/project/CLAUDE.md')).toBe('claude-md');
    });

    test('should detect CLAUDE.local.md files', () => {
      expect(detectClaudeFileType('/project/CLAUDE.local.md')).toBe(
        'claude-local-md',
      );
    });

    test('should detect slash command files', () => {
      expect(detectClaudeFileType('/project/.claude/commands/deploy.md')).toBe(
        'slash-command',
      );
    });
  });

  describe('extractTagsFromContent', () => {
    test('should extract hashtags from content', () => {
      const content = 'This is #typescript and #nextjs project';
      expect(extractTagsFromContent(content)).toEqual(['typescript', 'nextjs']);
    });

    test('should return empty array for no tags', () => {
      expect(extractTagsFromContent('No tags here')).toEqual([]);
    });
  });

  describe('extractCommandsFromContent', () => {
    test('should extract slash commands', () => {
      const content = '/deploy <environment>\n/test --watch';
      const commands = extractCommandsFromContent(content);
      expect(commands).toHaveLength(2);
      expect(commands[0]?.name).toBe('deploy');
      expect(commands[0]?.hasArguments).toBe(true);
    });
  });

  describe('getFileScope', () => {
    test('should detect user scope for home directory files', () => {
      const homePath = homedir();
      expect(getFileScope(`${homePath}/.claude/CLAUDE.md`)).toBe('user');
    });

    test('should detect project scope for non-home files', () => {
      expect(getFileScope('/project/CLAUDE.md')).toBe('project');
    });
  });

  describe('normalizeFilePath', () => {
    test('should expand ~ to home directory', () => {
      const homePath = homedir();
      expect(normalizeFilePath('~/test.md')).toBe(`${homePath}/test.md`);
      expect(normalizeFilePath('~/.claude/CLAUDE.md')).toBe(
        `${homePath}/.claude/CLAUDE.md`,
      );
    });

    test('should handle absolute paths unchanged', () => {
      expect(normalizeFilePath('/absolute/path/file.md')).toBe(
        '/absolute/path/file.md',
      );
      expect(normalizeFilePath('/Users/test/CLAUDE.md')).toBe(
        '/Users/test/CLAUDE.md',
      );
    });

    test('should handle relative paths unchanged', () => {
      expect(normalizeFilePath('./relative/path.md')).toBe(
        './relative/path.md',
      );
      expect(normalizeFilePath('../parent/file.md')).toBe('../parent/file.md');
      expect(normalizeFilePath('src/file.md')).toBe('src/file.md');
    });

    test('should handle paths without ~ unchanged', () => {
      expect(normalizeFilePath('simple.md')).toBe('simple.md');
      expect(normalizeFilePath('folder/file.md')).toBe('folder/file.md');
    });
  });
}
