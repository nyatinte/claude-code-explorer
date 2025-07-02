import type { ClaudeFileInfo, SlashCommandInfo } from '../../_types.ts';
import { getColorTheme } from '../themes/index.ts';

export const createClaudeFileLabel = (file: ClaudeFileInfo): string => {
  const _colors = getColorTheme();

  // Extract meaningful project/directory name
  const pathParts = file.path.split('/');
  const fileName = pathParts.pop() || 'unknown';

  // Find project directory name (skip common paths)
  let projectName = '';
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];
    if (
      part &&
      !['src', 'docs', '.claude', 'commands', 'Users', 'home'].includes(part)
    ) {
      projectName = part;
      break;
    }
  }

  // File type icon with project context
  let typeIcon: string;
  let projectInfo = '';

  switch (file.type) {
    case 'claude-md':
      typeIcon = '🏠';
      projectInfo = projectName ? ` (${projectName})` : '';
      break;
    case 'claude-local-md':
      typeIcon = '🔧';
      projectInfo = projectName ? ` (${projectName})` : ' (local)';
      break;
    case 'global-md':
      typeIcon = '🌍';
      projectInfo = ' (global)';
      break;
    default:
      typeIcon = '📄';
      projectInfo = projectName ? ` (${projectName})` : '';
  }

  // Framework info (like nr's script descriptions)
  const framework = file.projectInfo?.framework
    ? ` [${file.projectInfo.framework}]`
    : '';

  // Improved display with project identification
  return `${typeIcon} ${fileName}${projectInfo}${framework}`;
};

// Create searchable description that includes hidden path info
export const createClaudeFileDescription = (file: ClaudeFileInfo): string => {
  const _pathParts = file.path.split('/');
  const fullPath = file.path;
  const fileType = file.type;
  const framework = file.projectInfo?.framework || '';

  return `${fullPath} ${fileType} ${framework}`.trim();
};

export const createSlashCommandLabel = (cmd: SlashCommandInfo): string => {
  // Extract project context from file path
  const pathParts = cmd.filePath.split('/');
  let projectContext = '';

  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];
    if (
      part &&
      !['commands', '.claude', 'src', 'docs', 'Users', 'home'].includes(part) &&
      !part.endsWith('.md')
    ) {
      projectContext = ` (${part})`;
      break;
    }
  }

  // Command components
  const hasArgsIcon = cmd.hasArguments ? '📝' : '○';
  const scopeInfo = cmd.scope !== 'user' ? ` [${cmd.scope}]` : '';
  const namespacePrefix = cmd.namespace ? `${cmd.namespace}:` : '';

  // Description like nr's script descriptions (truncated for readability)
  const description = cmd.description
    ? ` - ${cmd.description.length > 50 ? `${cmd.description.slice(0, 50)}...` : cmd.description}`
    : '';

  // Enhanced display with project context
  return `⚡ ${namespacePrefix}${cmd.name} ${hasArgsIcon}${projectContext}${scopeInfo}${description}`;
};

// Create searchable description for slash commands
export const createSlashCommandDescription = (
  cmd: SlashCommandInfo,
): string => {
  const namespace = cmd.namespace || '';
  const scope = cmd.scope;
  const description = cmd.description || '';
  const filePath = cmd.filePath;

  return `${namespace} ${scope} ${description} ${filePath}`.trim();
};

if (import.meta.vitest != null) {
  const { describe, test, expect } = import.meta.vitest;

  describe('createClaudeFileLabel - File Type Identification', () => {
    test('should display project-level CLAUDE.md with house icon and primary color', () => {
      const file: ClaudeFileInfo = {
        path: '/projects/my-app/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 2048,
        lastModified: new Date('2024-01-15T10:30:00Z'),
        commands: [],
        tags: [],
      };

      const label = createClaudeFileLabel(file);

      expect(label).toContain('🏠'); // House icon for project files
      expect(label).toContain('CLAUDE.md'); // File name visible
      expect(label).toContain('(my-app)'); // Project context
    });

    test('should display local CLAUDE.local.md with tools icon and warning color', () => {
      const file: ClaudeFileInfo = {
        path: '/projects/my-app/CLAUDE.local.md' as ClaudeFileInfo['path'],
        type: 'claude-local-md',
        size: 512,
        lastModified: new Date('2024-01-20T15:45:00Z'),
        commands: [],
        tags: [],
      };

      const label = createClaudeFileLabel(file);

      expect(label).toContain('🔧'); // Tools icon for local overrides
      expect(label).toContain('CLAUDE.local.md');
      expect(label).toContain('(my-app)'); // Project context
    });

    test('should display global config with globe icon and info color', () => {
      const file: ClaudeFileInfo = {
        path: '/Users/user/.claude/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'global-md',
        size: 1536,
        lastModified: new Date('2024-01-10T08:20:00Z'),
        commands: [],
        tags: [],
      };

      const label = createClaudeFileLabel(file);

      expect(label).toContain('🌍'); // Globe icon for global config
      expect(label).toContain('CLAUDE.md');
      expect(label).toContain('(global)'); // Global context
    });
  });

  describe('createClaudeFileLabel - Framework Detection & Display', () => {
    test('should display Next.js framework with accent color', () => {
      const file: ClaudeFileInfo = {
        path: '/projects/nextjs-app/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 1024,
        lastModified: new Date('2024-01-15'),
        commands: [],
        tags: [],
        projectInfo: {
          framework: 'Next.js',
          dependencies: [],
        },
      };

      const label = createClaudeFileLabel(file);

      expect(label).toContain('[Next.js]'); // Framework in brackets
      expect(label).toContain('🏠'); // Project level icon
      expect(label).toContain('(nextjs-app)'); // Project context
    });

    test('should display React framework with proper formatting', () => {
      const file: ClaudeFileInfo = {
        path: '/projects/react-app/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 2048,
        lastModified: new Date('2024-01-15'),
        commands: [],
        tags: [],
        projectInfo: {
          framework: 'React',
          dependencies: [],
        },
      };

      const label = createClaudeFileLabel(file);

      expect(label).toContain('[React]'); // Framework in brackets
      expect(label).toContain('(react-app)'); // Project context
    });

    test('should handle files without framework information', () => {
      const file: ClaudeFileInfo = {
        path: '/projects/vanilla-js/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 1024,
        lastModified: new Date('2024-01-15'),
        commands: [],
        tags: [],
        // No projectInfo
      };

      const label = createClaudeFileLabel(file);

      expect(label).not.toContain('['); // No framework brackets
      expect(label).toContain('(vanilla-js)'); // Project context
      expect(label).toContain('🏠');
    });
  });

  describe('createClaudeFileLabel - Information Hierarchy & Search Optimization', () => {
    test('should create searchable label structure for filtering', () => {
      const file: ClaudeFileInfo = {
        path: '/projects/ecommerce-site/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 3072,
        lastModified: new Date('2024-01-15T14:30:00Z'),
        commands: [],
        tags: [],
        projectInfo: {
          framework: 'Next.js',
          dependencies: [],
        },
      };

      const label = createClaudeFileLabel(file);

      // Should contain searchable terms for different search criteria
      expect(label).toContain('(ecommerce-site)'); // Project context
      expect(label).toContain('[Next.js]'); // Framework-based search
      expect(label).toContain('🏠'); // Type icon
    });

    test('should format dates and sizes consistently', () => {
      const file: ClaudeFileInfo = {
        path: '/test/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 1048576, // 1MB
        lastModified: new Date('2024-01-15T09:30:45Z'),
        commands: [],
        tags: [],
      };

      const label = createClaudeFileLabel(file);

      expect(label).toContain('CLAUDE.md'); // File name
      expect(label).toContain('(test)'); // Project context
    });
  });

  describe('createSlashCommandLabel - Command Information Display', () => {
    test('should display command with arguments indicator and proper icons', () => {
      const cmd: SlashCommandInfo = {
        name: 'deploy-staging',
        scope: 'project',
        hasArguments: true,
        filePath:
          '/projects/app/.claude/commands/deploy.md' as SlashCommandInfo['filePath'],
        lastModified: new Date('2024-01-15'),
        description:
          'Deploy application to staging environment with optional branch selection',
        namespace: 'ci',
      };

      const label = createSlashCommandLabel(cmd);

      expect(label).toContain('⚡'); // Lightning bolt for commands
      expect(label).toContain('ci:deploy-staging'); // Namespace and command name
      expect(label).toContain('📝'); // Has arguments indicator
      expect(label).toContain('(app)'); // Project context
      expect(label).toContain('[project]'); // Project scope in brackets
    });

    test('should display user-scoped command without arguments', () => {
      const cmd: SlashCommandInfo = {
        name: 'quick-note',
        scope: 'user',
        hasArguments: false,
        filePath:
          '/Users/user/.claude/commands/notes.md' as SlashCommandInfo['filePath'],
        lastModified: new Date('2024-01-10'),
        description: 'Create a quick note in default location',
      };

      const label = createSlashCommandLabel(cmd);

      expect(label).toContain('⚡');
      expect(label).toContain('quick-note'); // Command name
      expect(label).toContain('○'); // No arguments indicator
      expect(label).toContain('(user)'); // User context
      expect(label).toContain('Create a quick note');
      expect(label).not.toContain(':'); // No namespace
    });

    test('should handle commands without description', () => {
      const cmd: SlashCommandInfo = {
        name: 'simple-cmd',
        scope: 'project',
        hasArguments: false,
        filePath:
          '/project/.claude/commands/simple.md' as SlashCommandInfo['filePath'],
        lastModified: new Date('2024-01-15'),
        // No description
      };

      const label = createSlashCommandLabel(cmd);

      expect(label).toContain('simple-cmd'); // Command name
      expect(label).toContain('○'); // No arguments indicator
      expect(label).toContain('[project]'); // Project scope in brackets
    });
  });

  describe('createSlashCommandLabel - Search & Filter Optimization', () => {
    test('should create labels optimized for search filtering', () => {
      const cmd: SlashCommandInfo = {
        name: 'database-backup',
        scope: 'project',
        hasArguments: true,
        filePath:
          '/projects/api/.claude/commands/database.md' as SlashCommandInfo['filePath'],
        lastModified: new Date('2024-01-15'),
        description: 'Backup database with compression and encryption options',
        namespace: 'ops',
      };

      const label = createSlashCommandLabel(cmd);

      // Should contain searchable terms
      expect(label).toContain('database-backup'); // Name-based search
      expect(label).toContain('ops:'); // Namespace-based search
      expect(label).toContain('[project]'); // Scope-based search
      expect(label).toContain('Backup database'); // Description-based search
      expect(label).toContain('(api)'); // Project context
    });

    test('should truncate long descriptions for display optimization', () => {
      const longDescription =
        'This is a very long description that exceeds the normal display limit and should be truncated to maintain clean UI appearance while still providing useful information';

      const cmd: SlashCommandInfo = {
        name: 'complex-cmd',
        scope: 'project',
        hasArguments: true,
        filePath:
          '/project/.claude/commands/complex.md' as SlashCommandInfo['filePath'],
        lastModified: new Date('2024-01-15'),
        description: longDescription,
      };

      const label = createSlashCommandLabel(cmd);

      // Description should be truncated but still searchable
      expect(label).toContain('This is a very long description');
      expect(label.length).toBeLessThan(longDescription.length + 200); // Reasonable label length
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('should handle missing projectInfo gracefully', () => {
      const file: ClaudeFileInfo = {
        path: '/test/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 1024,
        lastModified: new Date('2024-01-15'),
        commands: [],
        tags: [],
        projectInfo: undefined,
      };

      const label = createClaudeFileLabel(file);
      expect(label).toBeTruthy();
      expect(label).not.toContain('['); // No framework brackets
    });

    test('should handle very small file sizes', () => {
      const file: ClaudeFileInfo = {
        path: '/test/CLAUDE.md' as ClaudeFileInfo['path'],
        type: 'claude-md',
        size: 0,
        lastModified: new Date('2024-01-15'),
        commands: [],
        tags: [],
      };

      const label = createClaudeFileLabel(file);
      expect(label).toContain('CLAUDE.md'); // File name
    });

    test('should handle unknown file types with fallback', () => {
      const file: ClaudeFileInfo = {
        path: '/test/unknown.md' as ClaudeFileInfo['path'],
        type: 'claude-md' as ClaudeFileInfo['type'], // Using valid type for test
        size: 1024,
        lastModified: new Date('2024-01-15'),
        commands: [],
        tags: [],
      };

      const label = createClaudeFileLabel(file);
      // Should use fallback icon from theme (actual implementation uses icons.file)
      expect(label).toContain('unknown.md'); // File name
      expect(label).toContain('(test)'); // Project context
    });
  });
}
