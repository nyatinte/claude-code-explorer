# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**claude-explorer** - CLI tool for exploring and managing Claude Code settings and slash commands. The tool scans for CLAUDE.md files and slash commands in projects, providing interactive exploration and file management capabilities.

## Core Commands

```bash
# Development
bun run start                   # Run CLI in development mode
bun run build                   # Build for production (outputs to dist/)
bun run typecheck              # TypeScript type checking

# Testing (InSource Testing Pattern)
bun run test                   # Run all tests (90 tests across 11 files)
bun run test:watch            # Test in watch mode
bun run test src/_utils.ts    # Run tests for specific file

# Quality Management
bun run check                  # Biome lint/format check
bun run check:write           # Biome auto-fix
bun run check:unsafe          # Biome unsafe auto-fix
bun run ci                    # Full CI pipeline (build + check + test)

# CLI Usage
./dist/index.js               # Default: interactive mode
./dist/index.js scan          # Scan for Claude files
./dist/index.js preview       # Preview file contents
./dist/index.js copy          # Copy files/sections
./dist/index.js interactive   # Explicit interactive mode
```

## Technical Architecture

### Main Tech Stack

- **Runtime**: Bun + Node.js (>= 20) - ESM only
- **CLI Framework**: gunshi (Type-safe CLI command definition)
- **Build**: tsdown (Rolldown/Oxc) → produces shebang executable
- **Testing**: vitest (InSource Testing + globals)
- **Linting**: Biome (v2.0.6) with strict rules
- **Dependency Management**: knip for unused dependency detection
- **File Operations**: tinyglobby + node:fs/promises
- **Pattern Matching**: ts-pattern for complex conditional logic
- **Validation**: zod + branded types for runtime type safety
- **UI**: picocolors + consola for beautiful CLI output
- **Interactive Prompts**: @inquirer/prompts for fzf-style search and navigation

### Directory Structure

```sh
src/
├── commands/           # CLI commands (gunshi pattern)
│   ├── scan.ts        # File scanning
│   ├── interactive.ts # Interactive mode with search
│   ├── preview.ts     # File preview
│   └── copy.ts        # File copying
├── ui/                # User interface components
│   ├── components/    # Reusable UI components
│   │   ├── file-display.ts # File labeling and display
│   │   └── index.ts   # Component exports
│   ├── prompts/       # Interactive prompts
│   │   ├── enhanced-select.ts # fzf-style search select
│   │   └── index.ts   # Prompt exports
│   └── themes/        # Theming and styling
│       ├── capabilities.ts # Terminal capability detection
│       ├── colors.ts  # Color theme management
│       └── index.ts   # Theme exports
├── _types.ts          # Type definitions (including branded types)
├── _utils.ts          # Utility functions + InSource tests
├── _consts.ts         # Constants
├── _shared-args.ts    # Common CLI parameters
├── claude-md-scanner.ts    # CLAUDE.md file scanner
├── slash-command-scanner.ts # Slash command scanner
└── index.ts           # Entry point
```

### Core Architecture Patterns

1. **InSource Testing**: Tests defined alongside source code for co-location

   ```typescript
   if (import.meta.vitest != null) {
     const { describe, test, expect } = import.meta.vitest;
     describe('functionName', () => {
       test('should work', () => {
         expect(result).toBe(expected);
       })
     })
   }
   ```

2. **Branded Types + Runtime Validation**: Compile-time & runtime type safety

   ```typescript
   // Type-level branding
   export type ClaudeFilePath = string & { readonly [ClaudeFilePathBrand]: true };
   
   // Runtime validation
   export const ClaudeFilePathSchema = z.string().refine(/* validation */);
   export const createClaudeFilePath = (path: string): ClaudeFilePath => {
     ClaudeFilePathSchema.parse(path);
     return path as ClaudeFilePath;
   };
   ```

3. **Gunshi Command Architecture**: Modular CLI with type-safe arguments

   ```typescript
   export const scanCommand = define({
     name: 'scan',
     args: sharedArgs, // Reusable argument schemas
     run: async (ctx) => {
       const { path, recursive, type } = ctx.values; // Fully typed
     }
   });
   ```

4. **Pattern Matching for File Type Detection**: 

   ```typescript
   const detectClaudeFileType = (fileName: string, dirPath: string): ClaudeFileType => {
     return match([fileName, dirPath])
       .with(['CLAUDE.md', P._], () => 'claude-md' as const)
       .with(['CLAUDE.local.md', P._], () => 'claude-local-md' as const)
       .otherwise(() => 'unknown' as const);
   };
   ```

5. **Interactive UI with Search**: nr-like experience with fzf-style search

   ```typescript
   // Enhanced select with search functionality
   const selected = await selectWithArrows(options, {
     title: 'Claude Configuration Files',
     enableFilter: true,
     enableSearch: true,
     filterPlaceholder: 'Search by name, type, or framework...',
   });
   ```

### Data Flow Architecture

- **Scanners**: `claude-md-scanner.ts` + `slash-command-scanner.ts` → discover files
- **Type System**: `_types.ts` → branded types + zod schemas for data integrity  
- **Commands**: Modular commands in `commands/` → process user requests
- **Utils**: `_utils.ts` → shared utilities with comprehensive InSource tests
- **Constants**: `_consts.ts` → centralized magic strings and configuration

### Target File Discovery

The tool automatically discovers these file types:

- **CLAUDE.md** → Project-level configuration (most common)
- **CLAUDE.local.md** → Local overrides (gitignored)  
- **~/.claude/CLAUDE.md** → Global user configuration
- **.claude/commands/**/*.md** → Slash command definitions

### TypeScript Configuration

**Ultra-strict type checking** enabled via tsconfig.json:
- `exactOptionalPropertyTypes: true` → No `| undefined` on optional props
- `noUncheckedIndexedAccess: true` → Array access returns `T | undefined`
- `noImplicitReturns: true` → All code paths must return
- Immutable design with `readonly` properties throughout

### Testing Philosophy

- **InSource Testing**: Tests live with source code (142 tests across 20 files)
- **fs-fixture**: File system test fixtures for reliable testing
- **vitest globals**: `describe`/`test`/`expect` available without imports
- **No test shortcuts**: All quality checks must pass before completion
- **Comprehensive coverage**: All UI components, utilities, and business logic tested

### CLI User Experience

- **Default behavior**: Interactive mode when no command specified
- **Subcommands**: `scan`, `preview`, `copy`, `interactive`
- **JSON output**: `--output json` for programmatic usage
- **Rich UI**: Table views, colored output, progress indicators, fzf-style search
- **Navigation**: ESC key support for returning to previous menus
- **Search functionality**: Type-ahead filtering for files and commands
- **Error handling**: User-friendly messages with debug mode support

## Quality Management Rules

### Mandatory Pre-Submission Checklist

**All tasks MUST complete this full pipeline before submission:**

```bash
# Complete pipeline (run in sequence)
bun run typecheck              # TypeScript: 0 errors required
bun run check:write           # Biome: Auto-fix + 0 errors required
bun run knip                  # Dependency cleanup: 0 unused items required  
bun run test                  # Tests: 100% pass rate required (142/142)
bun run build                 # Build: Must complete without errors
```

**Alternative single command:**
```bash
bun run ci                    # Runs build + check + knip + test in sequence
```

### Quality Standards (Zero Tolerance)

- **TypeScript**: 0 type errors (strict mode enforced)
- **Biome**: 0 lint/format errors (style rules strictly enforced)
- **Knip**: 0 unused dependencies, exports, or types (clean dependency management)
- **Tests**: 100% pass rate (142/142 tests across 20 files)
- **Build**: Clean tsdown build to dist/ with executable permissions

### Implementation Rules

- **No shortcuts**: Never skip quality checks or claim completion with failing tests
- **No flag shortcuts**: NEVER use `-n` or similar flags to skip quality checks
- **Fix, don't disable**: Resolve lint errors rather than adding ignore comments  
- **Test coverage**: InSource tests required for all utility functions
- **Error handling**: Graceful degradation with user-friendly error messages
- **Dependency management**: Keep dependencies clean - remove unused imports and exports immediately

### TypeScript Coding Standards (Strictly Enforced)

- **Type definitions**: ALWAYS use `type` instead of `interface` for consistency and better type inference
- **Function definitions**:
  - **Components**: Use `function` declaration syntax
  - **Regular functions**: Use arrow function syntax
- **Exports**: Avoid `default export` except for page components
- **Type safety**: 
  - NEVER use `any` type - it is strictly forbidden
  - Avoid `as` type assertions - use proper type guards instead
- **Code organization**: Follow established patterns in the codebase for consistency

### Development Workflow Integration

- Use `bun run test:watch` during development
- Run `bun run check:write` frequently to auto-fix formatting
- Verify with `bun run ci` before considering task complete
