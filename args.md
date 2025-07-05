# CLI引数対応 - 要件定義書

## 概要

Claude Explorerは現在インタラクティブTUIのみの対応となっているが、基本的なCLIオプション（`--help`, `--version`, `--path`）を追加し、ユーザビリティを向上させる。

## 現在の状況

### 問題点

- コマンドライン引数が完全に無視される（`_args = []`）
- `--help`, `--version`などの標準的なCLIオプションが存在しない
- パス指定やオプション設定ができない
- ヘルプ情報が提供されない

### 既存インフラ

- `ScanOptions`型が定義済み
- スキャナー関数は引数をサポート済み
- 引数パースライブラリは未導入

## 要件定義

### 1. サポートするコマンドライン引数

#### 必須オプション

```bash
claude-explorer --help              # ヘルプ表示
claude-explorer --version           # バージョン表示  
claude-explorer --path /custom/path # 指定パス以下をスキャン
```

### 2. 動作仕様

#### ヘルプオプション（`--help`, `-h`）

```
Usage: claude-explorer [options]

Options:
  -h, --help              Show help information
  -v, --version           Show version number
  -p, --path <path>       Specify directory to scan (default: root directory)
Examples:
  claude-explorer                    # Interactive TUI mode
  claude-explorer --path ~/projects # Scan specific directory


For more information, visit: https://github.com/username/claude-explorer
```

#### バージョンオプション（`--version`, `-v`）

```
claude-explorer v1.0.0
```

#### パスオプション（`--path`, `-p`）

- 指定されたディレクトリをスキャン対象に設定
- 相対パス・絶対パス両方対応
- 無効なパスの場合はエラー表示

### 3. 技術実装計画

#### Phase 1: 基本CLI引数対応

1. **引数パースライブラリ導入**
   - 候補: `commander.js`, `yargs`, `minimist`
   - 推奨: `commander.js`（TypeScript対応、軽量）

2. **エントリーポイント修正** (`src/index.tsx`)

   ```typescript
   import { program } from 'commander';
   import { readFileSync } from 'fs';
   import { dirname, join } from 'path';
   import { fileURLToPath } from 'url';
   
   const __dirname = dirname(fileURLToPath(import.meta.url));
   const packageJson = JSON.parse(
     readFileSync(join(__dirname, '../package.json'), 'utf-8')
   );
   
   program
     .name('claude-explorer')
     .description('Interactive CLI tool for exploring Claude Code settings')
     .version(packageJson.version)
     .option('-p, --path <path>', 'directory to scan', process.cwd())

'interactive');

   program.parse();
   const options = program.opts();

   ```

3. **App コンポーネント修正** (`src/App.tsx`)
   ```typescript
   type AppProps = {
     args: {
       path: string;

     };
   };
   
   export function App({ args }: AppProps) {
     // 引数に基づく条件分岐処理
   }
   ```

#### Phase 2: 非インタラクティブ出力対応

1. **JSON出力実装**

   ```typescript
   function outputJson(scanResults: ClaudeFile[]) {
     console.log(JSON.stringify(scanResults, null, 2));
     process.exit(0);
   }
   ```

2. **テーブル出力実装**
   - `cli-table3`等のライブラリ使用
   - ファイル名、タイプ、パスを表形式で表示

#### Phase 3: 入力検証・エラーハンドリング

1. **パス検証**

   ```typescript
   import { access, constants } from 'fs/promises';
   
   async function validatePath(path: string): Promise<void> {
     try {
       await access(path, constants.F_OK | constants.R_OK);
     } catch {
       throw new Error(`Invalid or inaccessible path: ${path}`);
     }
   }
   ```

2. **エラー表示の統一**
   - React Ink以外での適切なエラー表示
   - 終了コードの適切な設定

### 4. ファイル変更一覧

#### 修正対象ファイル

1. **`package.json`** - commander.js依存関係追加
2. **`src/index.tsx`** - 引数パース処理追加
3. **`src/App.tsx`** - 引数受け取り・条件分岐処理
4. **`src/_types.ts`** - CLI引数型定義追加
5. **`README.md`** - 使用方法・オプション説明更新

#### 新規ファイル

1. **`src/cli-output.ts`** - 非インタラクティブ出力処理
2. **`src/cli-validation.ts`** - 引数検証処理

### 5. テスト計画

#### 単体テスト

```typescript
// src/cli-validation.test.ts
describe('CLI validation', () => {
  test('should validate existing path', async () => {
    await expect(validatePath('.')).resolves.not.toThrow();
  });
  
  test('should reject non-existent path', async () => {
    await expect(validatePath('/non/existent')).rejects.toThrow();
  });
});
```

#### 統合テスト

```bash
# ヘルプ表示テスト
bun run build && ./dist/index.js --help

# バージョン表示テスト  
bun run build && ./dist/index.js --version

# パス指定テスト
bun run build && ./dist/index.js --path ./src

# JSON出力テスト
bun run build && ./dist/index.js --output json
```

### 6. 品質チェックリスト

#### 実装完了条件

- [ ] 全テストパス（`bun run test`）
- [ ] 型チェックパス（`bun run typecheck`）  
- [ ] Biome lintパス（`bun run check:write`）
- [ ] ビルド成功（`bun run build`）
- [ ] ヘルプ・バージョン・パス指定が正常動作
- [ ] 既存のTUI機能に影響なし

#### パフォーマンス要件

- CLI起動時間: 100ms以内
- ヘルプ表示時間: 50ms以内
- エラー表示時間: 50ms以内

### 7. README.md更新内容

#### 使用方法セクション

```markdown
## Usage

### Interactive Mode (Default)
```bash
claude-explorer                    # Launch interactive TUI
claude-explorer --path ~/projects # Scan specific directory
```

### Command Line Options

```bash
claude-explorer --help             # Show help information
claude-explorer --version          # Show version number
claude-explorer --path <path>      # Specify directory to scan
claude-explorer --output json      # Output results as JSON
claude-explorer --no-recursive     # Disable recursive scanning
claude-explorer --include-hidden   # Include hidden files
```

### Examples

```bash
# Interactive exploration of current directory
claude-explorer

# Scan specific project directory
claude-explorer --path /path/to/project

# Get JSON output for scripting
claude-explorer --output json --path ./src

# Include hidden files in scan
claude-explorer --include-hidden
```

```

#### CLI Reference追加
```markdown
## CLI Reference

| Option             | Short | Description                              | Default           |
| ------------------ | ----- | ---------------------------------------- | ----------------- |
| `--help`           | `-h`  | Show help information                    | -                 |
| `--version`        | `-v`  | Show version number                      | -                 |
| `--path`           | `-p`  | Directory to scan                        | Current directory |
| `--output`         | -     | Output format (interactive, json, table) | interactive       |
| `--no-recursive`   | -     | Disable recursive scanning               | false             |
| `--include-hidden` | -     | Include hidden files                     | false             |
```

### 8. React Ink実装ガイド

#### useInputとCLI引数の分離

```typescript
// CLI引数がある場合は非インタラクティブ処理
if (args.output !== 'interactive') {
  // JSON/table出力で即座に終了
  return null; // React Inkコンポーネントを描画しない
}

// インタラクティブモードのみでReact Ink使用
return (
  <Box flexDirection="column">
    <FileList files={files} />
    <Preview file={selectedFile} />
  </Box>
);
```

#### フォーカス管理の注意点

- CLIオプション処理時は`useInput`フックを使用しない
- 条件分岐でReact Inkコンポーネントの描画を制御
- `isActive`プロパティで入力ハンドリングを適切に管理

### 9. 実装優先度

#### 高優先度（Phase 1）

1. `--help`, `--version`, `--path`の基本オプション
2. 引数パース処理の実装
3. 既存TUI機能との統合

#### 中優先度（Phase 2）  

1. JSON出力フォーマット
2. パス検証・エラーハンドリング
3. テスト実装

#### 低優先度（Phase 3）

1. テーブル出力フォーマット
2. `--no-recursive`, `--include-hidden`オプション
3. パフォーマンス最適化

## 完了基準

✅ `--help`, `--version`, `--path`オプションが正常動作  
✅ 既存のReact Ink TUI機能に影響なし  
✅ 全品質チェック（CI pipeline）が通過  
✅ README.mdが更新され、使用方法が明確  
✅ TypeScript型安全性が保たれている
