# Claude Explorer - 技術仕様書 (AIコーディングエージェント向け)

## 📋 プロジェクト概要

**プロジェクト名**: claude-explorer  
**バージョン**: 1.0.0  
**開発手法**: TDD with InSource Testing  

## 🎯 プロダクト概要

Claude Codeエコシステムの設定ファイル（CLAUDE.md）とSlash Commandsを横断的に探索・管理・共有するCLIツール。開発者がプロジェクト間でClaude設定を効率的に発見・再利用することを可能にする。

## 🛠 技術仕様 (ccusageリポジトリ参考)

### コア技術スタック

#### **Runtime & Build**

- **Bun** (runtime): JavaScript/TypeScriptランタイム
- **tsdown**: ライブラリバンドリング (Rolldown/Oxc使用)
- **Node.js**: 最小要件

#### **CLI & Testing**

- **gunshi**: モダンCLIフレームワーク
- **vitest**: テストフレームワーク + InSource Testing
- **@types/bun**: Bun型定義

#### **Utilities & Validation**

- **zod**: スキーマバリデーション + branded types
- **es-toolkit**: ユーティリティライブラリ
- **type-fest**: TypeScript型ユーティリティ
- **consola**: ロガー
- **picocolors**: カラー出力
- **cli-table3**: テーブル表示

#### **File System & Patterns**

- **tinyglobby**: ファイル検索
- **path-type**: パス判定
- **xdg-basedir**: 設定ディレクトリ
- **ts-pattern**: パターンマッチング（ユーザー要求）

#### **開発時の支援ツール**

- **Context7**: ライブラリドキュメント検索（Claude Code開発用）
- **GitHub MCP**: Model Context Protocol経由でのGitHub統合（Claude Code開発用）

### package.json設定例 (ccusage参考)

```json
{
  "type": "module",
  "engines": { "node": ">=20" },
  "exports": {
    ".": "./dist/index.js",
    "./scan": "./dist/scan.js",
    "./interactive": "./dist/interactive.js"
  },
  "bin": "./dist/index.js",
  "scripts": {
    "build": "tsdown",
    "test": "vitest",
    "start": "bun run ./src/index.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

## 📁 プロジェクト構造 (ccusageパターン)

```
claude-explorer/
├── src/
│   ├── commands/           # CLI commands (gunshi pattern)
│   │   ├── index.ts        # CLI entry point
│   │   ├── scan.ts         # Scan command
│   │   ├── interactive.ts  # Interactive mode
│   │   ├── copy.ts         # Copy operations
│   │   └── preview.ts      # Preview command
│   ├── _types.ts           # Type definitions (with branded types)
│   ├── _utils.ts           # Utility functions + InSource tests
│   ├── _consts.ts          # Constants
│   ├── _shared-args.ts     # Shared CLI arguments
│   ├── claude-md-scanner.ts # CLAUDE.md file discovery
│   ├── slash-command-scanner.ts # Slash command discovery
│   ├── file-manager.ts     # File operations
│   ├── clipboard-manager.ts # Clipboard operations
│   ├── logger.ts           # Logging utilities
│   ├── mcp-client.ts       # MCP integration
│   └── index.ts           # Main entry point
├── vitest.config.ts       # Vitest config with InSource testing
├── tsdown.config.ts       # Build configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── README.md              # Documentation
```

## 🔍 機能要件

### Phase 1: Core Discovery & Management (MVP)

#### 1.1 ファイル探索機能

**対象ファイル**:

- `CLAUDE.md` (プロジェクト共有設定)
- `CLAUDE.local.md` (個人設定、gitignore対象)  
- `~/.claude/CLAUDE.md` (グローバル個人設定)
- `.claude/commands/**/*.md` (プロジェクトSlash Commands)
- `~/.claude/commands/**/*.md` (個人Slash Commands)

**技術仕様**:

```typescript
interface ClaudeFileInfo {
  readonly path: string
  readonly type: 'claude-md' | 'claude-local-md' | 'global-md'
  readonly size: number
  readonly lastModified: Date
  readonly projectInfo: ProjectInfo
  readonly commands: CommandInfo[]
  readonly tags: string[]
}

interface SlashCommandInfo {
  readonly name: string
  readonly scope: 'project' | 'user'
  readonly namespace?: string
  readonly description?: string
  readonly hasArguments: boolean
  readonly filePath: string
  readonly lastModified: Date
}
```

#### 1.2 基本CLI操作

```bash
# スキャン機能
claude-explorer scan [options]
  --path <path>          # 検索パス指定
  --recursive            # 再帰的検索
  --type <type>          # ファイルタイプフィルター
  --output <format>      # 出力形式 (table|json|yaml)

# インタラクティブモード
claude-explorer
claude-explorer interactive

# プレビュー機能  
claude-explorer preview <file-path>
claude-explorer preview --command <command-name>

# コピー機能
claude-explorer copy <source> [options]
  --to <destination>     # コピー先
  --clipboard           # クリップボードにコピー
  --section <name>      # セクション単位でコピー
```

#### 1.3 インタラクティブUI

**技術実装**:

- Gunshiの宣言型プロンプトシステム
- キーボードナビゲーション対応
- 複数選択機能
- プレビューペイン

**UI フロー**:

```
? What would you like to explore?
❯ 📋 CLAUDE.md files (5 found)
  ⚡️ Slash commands (12 found)  
  🔍 Search by content
  ⚙️ Settings

? Select a CLAUDE.md file:
❯ /projects/nextjs-app/CLAUDE.md - Next.js app with TypeScript
  /projects/api-server/CLAUDE.md - Express API server
  ~/.claude/CLAUDE.md - Global settings
  [Show More...]

? What would you like to do?
❯ 📄 Preview content
  📋 Copy to clipboard
  📁 Copy to current directory
  ✏️  Edit in $EDITOR
  🔗 Copy file path
  ⚙️  Extract specific sections
```

### Phase 2: Advanced Features

#### 2.1 検索・フィルタリング

```bash
# コンテンツ検索
claude-explorer search "typescript" "npm run build"

# タグ検索  
claude-explorer search --tag nextjs --tag typescript

# コマンドタイプ検索
claude-explorer search --command-type project
claude-explorer search --scope user
```

#### 2.2 インテリジェント分析

```typescript
interface ProjectAnalysis {
  readonly techStack: string[]
  readonly buildCommands: string[]
  readonly testCommands: string[]
  readonly codeStyle: CodeStyleInfo
  readonly dependencies: string[]
  readonly complexity: 'simple' | 'moderate' | 'complex'
}
```

#### 2.3 マージ・テンプレート機能

```bash
# ファイルマージ
claude-explorer merge file1.md file2.md --output merged.md

# テンプレート生成
claude-explorer generate --template nextjs --output ./CLAUDE.md
claude-explorer templates list
```

### Phase 3: External Integrations

#### 3.1 Context7 統合

```typescript
class Context7Integration {
  async searchDocumentation(query: string): Promise<DocResult[]>
  async getLibraryInfo(libraryId: string): Promise<LibraryInfo>
  async validateDependencies(packages: string[]): Promise<ValidationResult>
}
```

#### 3.2 GitHub MCP統合

```typescript
class MCPGitHubIntegration {
  async syncWithRepository(repoUrl: string): Promise<void>
  async shareTemplate(template: ClaudeTemplate): Promise<string>
  async importFromGist(gistId: string): Promise<ClaudeFileInfo>
}
```

## 🧪 TDD戦略 (InSource Testing)

### テスト方針

**InSource Testing を中心としたTDD**:

- テストコードを実装ファイルと同じファイルに記述
- `if (import.meta.vitest != null)` パターンを使用
- 関数レベルでの細かい単体テスト
- ビルド時にテストコードは自動除去

### テストカバレッジ目標

- **InSource Tests**: 90%以上のユーティリティ関数
- **Integration Tests**: 主要フロー80%以上
- **E2E Tests**: CLI操作の基本シナリオ

### 実装パターン

```typescript
// src/_utils.ts
export const parseSlashCommandName = (fileName: string): string => {
  return fileName.replace(/\.md$/, '').replace(/\//g, ':')
}

export const validateClaudeMdContent = (content: string): boolean => {
  return content.includes('# ') || content.includes('## ')
}

// InSource Tests (同一ファイル内)
if (import.meta.vitest != null) {
  describe('parseSlashCommandName', () => {
    it('should convert file path to command name', () => {
      expect(parseSlashCommandName('deploy.md')).toBe('deploy')
      expect(parseSlashCommandName('frontend/component.md')).toBe('frontend:component')
    })

    it('should handle nested paths correctly', () => {
      expect(parseSlashCommandName('git/commit.md')).toBe('git:commit')
      expect(parseSlashCommandName('project/test/unit.md')).toBe('project:test:unit')
    })
  })

  describe('validateClaudeMdContent', () => {
    it('should validate valid CLAUDE.md content', () => {
      expect(validateClaudeMdContent('# Project Info\n## Setup')).toBe(true)
      expect(validateClaudeMdContent('## Build Commands')).toBe(true)
    })

    it('should reject invalid content', () => {
      expect(validateClaudeMdContent('Just plain text')).toBe(false)
      expect(validateClaudeMdContent('')).toBe(false)
    })
  })
}
```

### Integration Tests

```typescript
// src/claude-md-scanner.ts
import { expect, test, describe } from 'vitest'

export const scanClaudeFiles = async (options: ScanOptions): Promise<ClaudeFileInfo[]> => {
  // Implementation
}

// InSource Integration Tests
if (import.meta.vitest != null) {
  describe('scanClaudeFiles integration', () => {
    test('should find CLAUDE.md files in project', async () => {
      const results = await scanClaudeFiles({ 
        path: './fixtures/sample-project',
        recursive: true 
      })
      
      expect(results).toHaveLength(2)
      expect(results[0].type).toBe('claude-md')
    })

    test('should parse project info correctly', async () => {
      const results = await scanClaudeFiles({ 
        path: './fixtures/nextjs-project' 
      })
      
      expect(results[0].projectInfo.framework).toBe('Next.js')
      expect(results[0].projectInfo.language).toBe('TypeScript')
    })
  })
}
```

## 🔍 機能要件

### Core Discovery & Management

#### ファイル探索機能

**対象ファイル**:

- `CLAUDE.md` (プロジェクト共有設定)
- `CLAUDE.local.md` (個人設定、gitignore対象)  
- `~/.claude/CLAUDE.md` (グローバル個人設定)
- `.claude/commands/**/*.md` (プロジェクトSlash Commands)
- `~/.claude/commands/**/*.md` (個人Slash Commands)

#### 基本CLI操作

```bash
# スキャン機能
claude-explorer scan [options]
  --path <path>          # 検索パス指定
  --recursive            # 再帰的検索
  --type <type>          # ファイルタイプフィルター
  --output <format>      # 出力形式 (table|json)

# インタラクティブモード (デフォルト)
claude-explorer

# プレビュー機能  
claude-explorer preview <file-path>
claude-explorer preview --command <command-name>

# コピー機能
claude-explorer copy <source> [options]
  --to <destination>     # コピー先
  --clipboard           # クリップボードにコピー
```

#### インタラクティブUI

**UI フロー**:

```
? What would you like to explore?
❯ 📋 CLAUDE.md files (5 found)
  ⚡️ Slash commands (12 found)  
  🔍 Search by content

? Select a CLAUDE.md file:
❯ /projects/nextjs-app/CLAUDE.md - Next.js app with TypeScript
  /projects/api-server/CLAUDE.md - Express API server
  ~/.claude/CLAUDE.md - Global settings

? What would you like to do?
❯ 📄 Preview content
  📋 Copy to clipboard
  📁 Copy to current directory
  ✏️  Edit in $EDITOR
```

### Advanced Features

#### 検索・フィルタリング

```bash
# コンテンツ検索
claude-explorer search "typescript" "npm run build"

# タグ検索  
claude-explorer search --tag nextjs --tag typescript

# コマンド検索
claude-explorer search --command-type project
```

#### External Integrations

- **Context7 API**: ライブラリドキュメント検索統合
- **MCP GitHub**: Model Context Protocol経由でのGitHub統合

## 🔧 品質保証

### TypeScript設定 (strict mode)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Build設定

```typescript
// tsdown.config.ts  
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false, // Keep readable for CLI tools
})
```

### Linting (ccusage準拠)

```json
// package.json devDependencies
{
  "@ryoppippi/eslint-config": "^0.3.7",
  "eslint": "^9.29.0",
  "eslint-plugin-format": "^1.0.1"
}
```

## 🚀 実装ガイドライン

### 開発優先順位

1. **Core File Discovery** (TDD)
   - CLAUDE.mdファイルの探索機能
   - Slash commandsファイルの探索機能
   - InSource testingでユーティリティ関数をテスト

2. **CLI Commands** (gunshi)
   - scanコマンドの実装
   - interactiveコマンドの実装
   - 共通引数の定義

3. **Interactive UI**
   - consola + cli-table3での表示
   - ファイル選択インターフェース
   - アクション選択（preview, copy, edit）

4. **Copy & Preview Operations**
   - クリップボード操作
   - ファイルコピー操作
   - コンテンツプレビュー

5. **Advanced Features**
   - 検索・フィルタリング
   - MCP統合
   - Context7統合

### コーディング規約 (ユーザー好み反映)

```typescript
// ✅ 推奨パターン
// 1. type > interface
type ClaudeFile = {
  path: string
  content: string
}

// 2. function component style for main functions
function scanClaudeFiles(options: ScanOptions): Promise<ClaudeFileInfo[]> {
  // implementation
}

// 3. arrow functions for utilities
const formatFileName = (name: string): string => {
  return name.toLowerCase()
}

// 4. ts-pattern for complex conditionals
import { match } from 'ts-pattern'

const handleFileType = (type: ClaudeFileType) => 
  match(type)
    .with('claude-md', () => 'Project configuration')
    .with('claude-local-md', () => 'Local settings')
    .with('global-md', () => 'Global settings')
    .exhaustive()

// 5. No any - use proper types
const parseJsonSafely = <T>(json: string): T | null => {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

// 6. Avoid default export (except for pages)
export { scanClaudeFiles } // Named export preferred
```

### ファイル命名規則

- **Commands**: `commands/scan.ts`, `commands/interactive.ts`
- **Utilities**: `_utils.ts`, `_types.ts`, `_consts.ts`
- **Core Logic**: `claude-md-scanner.ts`, `slash-command-scanner.ts`
- **Tests**: InSource testing in same files

### InSource Testing規約

```typescript
// Always use conditional import check
if (import.meta.vitest != null) {
  // Use describe/test structure
  describe('functionName', () => {
    test('should handle normal case', () => {
      // Test implementation
    })

    test('should handle edge cases', () => {
      // Edge case tests
    })
  })
}
```

## 🎯 期待される成果物

### 最終的なCLIツール

```bash
# インストール
npm install -g claude-explorer

# 基本使用法
claude-explorer                    # Interactive mode
claude-explorer scan --recursive  # Scan all files  
claude-explorer copy ./CLAUDE.md --clipboard
claude-explorer preview ~/.claude/commands/deploy.md
```

### パッケージング

- **npm publishable**: `tsdown`でビルドされたESMパッケージ
- **bin entry**: グローバルインストール対応
- **Type definitions**: `.d.ts`ファイル付き
- **Documentation**: README + CLI help

---

**この技術仕様書は、ccusageリポジトリのアーキテクチャパターンを参考に、AIコーディングエージェントが効率的に開発できるよう設計されています。InSource Testingを活用したTDD開発により、高品質で保守性の高いCLIツールの実装を目指します。**
