# Claude Code Explorer

<div align="center">
  <img src="assets/icon.svg" alt="Claude Code Explorer Icon" width="128" height="128">
  <br><br>
  <strong>Interactive CLI tool for exploring and managing Claude Code settings and slash commands</strong>
  <br><br>
  <a href="https://www.npmjs.com/package/claude-code-explorer">
    <img src="https://img.shields.io/npm/v/claude-code-explorer.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/claude-code-explorer">
    <img src="https://img.shields.io/npm/dm/claude-code-explorer.svg" alt="npm downloads">
  </a>
  <a href="https://github.com/nyante/claude-code-explorer/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/claude-code-explorer.svg" alt="license">
  </a>
  <a href="https://github.com/nyante/claude-code-explorer">
    <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg" alt="node version">
  </a>
</div>

## Overview

**Claude Code Explorer** is a React Ink-based CLI tool that provides an interactive terminal interface for discovering, previewing, and managing Claude Code configuration files and slash commands. Navigate through your codebase to find CLAUDE.md files, slash command definitions, and other Claude-related configurations with a beautiful terminal UI.

## Features

- 🔍 **Interactive File Discovery** - Automatically finds Claude Code configuration files
- 📁 **Split-pane Interface** - File list on the left, preview on the right
- ⌨️ **Keyboard Navigation** - Arrow keys, Enter, ESC for smooth navigation
- 🔎 **Live Search** - Filter files as you type
- 📋 **File Actions** - Copy content, copy paths, open files in default applications
- 🎨 **Terminal UI** - Beautiful React Ink interface with proper focus management
- 📝 **Markdown Preview** - Renders CLAUDE.md files with syntax highlighting

## Screenshots

<div align="center">
  <img src="assets/thumbnail.png" alt="Claude Code Explorer Thumbnail" width="600">
  <br><br>
  <img src="assets/screenshot.png" alt="Claude Code Explorer Screenshot" width="800">
</div>

## Target Files

Claude Code Explorer automatically discovers these configuration files:

- **CLAUDE.md** → Project-level configuration (most common)
- **CLAUDE.local.md** → Local overrides (gitignored)
- **~/.claude/CLAUDE.md** → Global user configuration
- **.claude/commands/**/*.md** → Slash command definitions

## Installation

### Quick Start (Recommended)

No installation required! Run directly with:

```bash
# Using Bun (fastest)
bunx claude-code-explorer

# Using npm
npx claude-code-explorer

# Using pnpm
pnpm dlx claude-code-explorer
```

### Global Installation

For frequent use, install globally:

```bash
# npm
npm install -g claude-code-explorer

# Bun
bun install -g claude-code-explorer


# pnpm
pnpm add -g claude-code-explorer
```

Then run from anywhere:

```bash
claude-code-explorer
```

## Usage

### Interactive Mode (Default)

```bash
claude-code-explorer                    # Launch interactive TUI
claude-code-explorer --path ~/projects # Scan specific directory
```

### Command Line Options

```bash
claude-code-explorer --help             # Show help information
claude-code-explorer --version          # Show version number
claude-code-explorer --path <path>      # Specify directory to scan
```

### Examples

```bash
# Launch in current directory
bunx claude-code-explorer

# Scan specific project
bunx claude-code-explorer --path ~/my-project

# Quick exploration without installation
npx claude-code-explorer

# Show help
bunx claude-code-explorer --help

# Show version
bunx claude-code-explorer --version
```

### Common Use Cases

```bash
# Find all Claude configuration in your workspace
cd ~/workspace
bunx claude-code-explorer

# Check Claude settings in a specific project
bunx claude-code-explorer --path ./my-project

# Explore global Claude configuration
bunx claude-code-explorer --path ~/.claude
```

### Development Mode

```bash
bun run start      # Run with hot reload
bun run dev        # Development mode with watch
```

### Building

```bash
bun run build      # Build for production
```

## Keyboard Shortcuts

- **↑/↓** - Navigate file list
- **Enter** - Open file actions menu
- **ESC** - Close menu / Exit
- **Tab** - Switch between panes
- **/** - Focus search input
- **c** - Copy file content (in menu)
- **p** - Copy file path (in menu)
- **o** - Open file in default application (in menu)

## Development

### Tech Stack

- **Runtime**: Bun + Node.js (>= 20)
- **UI Framework**: React Ink v6
- **Components**: @inkjs/ui for enhanced terminal components
- **Build**: tsdown (Rolldown/Oxc) with shebang executable
- **Testing**: vitest + ink-testing-library
- **Linting**: Biome with strict rules
- **Type Safety**: TypeScript with ultra-strict configuration

### CLI Reference

| Option      | Short | Description           | Default           |
| ----------- | ----- | --------------------- | ----------------- |
| `--help`    | `-h`  | Show help information | -                 |
| `--version` | `-V`  | Show version number   | -                 |
| `--path`    | `-p`  | Directory to scan     | Current directory |

### Development Commands

```bash
# Quality pipeline
bun run ci                    # Full CI pipeline
bun run typecheck            # TypeScript checking
bun run check:write          # Auto-fix formatting
bun run test                 # Run all tests
bun run test:watch           # Test in watch mode

# Development
bun run start                # Run CLI in development
bun run dev                  # Development with watch
bun run build                # Build for production
```

### Architecture

- **InSource Testing** - Tests alongside source code
- **Branded Types** - Compile-time and runtime type safety
- **React Ink Components** - Terminal UI with proper focus management
- **Pattern Matching** - File type detection with ts-pattern
- **Immutable Design** - Readonly properties throughout

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the quality pipeline: `bun run ci`
5. Submit a pull request

## License

MIT License - see LICENSE file for details
