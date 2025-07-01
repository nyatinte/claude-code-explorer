import { homedir } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { consola } from 'consola';
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

export const getRelativePath = (
  filePath: string,
  basePath: string = process.cwd(),
): string => {
  return relative(basePath, filePath);
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
  return content.includes('# ') || content.includes('## ');
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
        consola.debug(ERROR_MESSAGES.PACKAGE_JSON_PARSE_ERROR, error);
        projectInfo = { ...projectInfo, isIncomplete: true };
      }
    }

    return projectInfo;
  } catch (error) {
    consola.debug('Failed to analyze project info:', error);
    return { isIncomplete: true };
  }
};

// String utilities
export const truncateString = (str: string, maxLength: number): string => {
  return str.length > maxLength ? `${str.slice(0, maxLength - 3)}...` : str;
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const unit = units[unitIndex];
  if (!unit) {
    throw new Error('Invalid unit index');
  }
  return `${size.toFixed(1)} ${unit}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Arrow key navigation utilities
export interface SelectableItem {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectionOptions {
  title?: string;
  filterPlaceholder?: string;
  enableFilter?: boolean;
  maxDisplayItems?: number;
}

export const selectWithArrows = async <T extends SelectableItem>(
  items: T[],
  options: SelectionOptions = {},
): Promise<T | null> => {
  const {
    title = '選択してください',
    filterPlaceholder = 'フィルタリング...',
    enableFilter = false,
    maxDisplayItems = 10,
  } = options;

  let currentIndex = 0;
  let filterText = '';
  let filteredItems = items.filter((item) => !item.disabled);

  const renderUI = () => {
    console.clear();

    if (title) {
      console.log(`\n${title}\n`);
    }

    if (enableFilter) {
      console.log(`${filterPlaceholder} ${filterText}\n`);
    }

    const displayItems = filteredItems.slice(0, maxDisplayItems);

    for (let i = 0; i < displayItems.length; i++) {
      const item = displayItems[i];
      if (!item) continue;
      const isSelected = i === currentIndex;
      const marker = isSelected ? '→' : ' ';
      const style = isSelected ? '\x1b[7m' : ''; // Reverse video
      const reset = isSelected ? '\x1b[0m' : '';

      console.log(`${marker} ${style}${item.label}${reset}`);
    }

    if (filteredItems.length > maxDisplayItems) {
      console.log(
        `\n... and ${filteredItems.length - maxDisplayItems} more items`,
      );
    }

    console.log('\n↑↓: Navigate, Enter: Select, Esc: Cancel');
    if (enableFilter) {
      console.log('Type to filter');
    }
  };

  const updateFilter = () => {
    filteredItems = items.filter((item) => {
      if (item.disabled) return false;
      if (!filterText) return true;
      return (
        item.label.toLowerCase().includes(filterText.toLowerCase()) ||
        item.value.toLowerCase().includes(filterText.toLowerCase())
      );
    });
    currentIndex = Math.min(
      currentIndex,
      Math.max(0, filteredItems.length - 1),
    );
  };

  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    renderUI();

    const onData = (key: string) => {
      switch (key) {
        case '\u001b[A': // Up arrow
          currentIndex = Math.max(0, currentIndex - 1);
          renderUI();
          break;

        case '\u001b[B': // Down arrow
          currentIndex = Math.min(filteredItems.length - 1, currentIndex + 1);
          renderUI();
          break;

        case '\r': {
          // Enter
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          const selected = filteredItems[currentIndex];
          resolve(selected || null);
          break;
        }

        case '\u001b': // Escape
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          resolve(null);
          break;

        case '\u007f': // Backspace
          if (enableFilter && filterText.length > 0) {
            filterText = filterText.slice(0, -1);
            updateFilter();
            renderUI();
          }
          break;

        default:
          // Regular character input for filtering
          if (enableFilter && key.length === 1 && key >= ' ') {
            filterText += key;
            updateFilter();
            renderUI();
          }
          break;
      }
    };

    stdin.on('data', onData);
  });
};

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

    test('should reject invalid content', () => {
      expect(validateClaudeMdContent('Just plain text')).toBe(false);
      expect(validateClaudeMdContent('')).toBe(false);
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

  describe('truncateString', () => {
    test('should truncate long strings', () => {
      expect(truncateString('This is a very long string', 10)).toBe(
        'This is...',
      );
    });

    test('should not truncate short strings', () => {
      expect(truncateString('Short', 10)).toBe('Short');
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(500)).toBe('500.0 B');
    });
  });

  describe('formatDate', () => {
    test('should format date in Japanese locale', () => {
      const date = new Date('2023-12-25T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/2023/);
      expect(formatted).toMatch(/12/);
      expect(formatted).toMatch(/25/);
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
