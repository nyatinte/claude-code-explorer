#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { program } from 'commander';
import { render } from 'ink';
import type { CliOptions } from './_types.js';
import { App } from './App.js';

// ESMでのpackage.json読み込み
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8'),
);

// CLI設定
program
  .name('claude-explorer')
  .description(
    'Interactive CLI tool for exploring Claude Code settings and slash commands',
  )
  .version(packageJson.version)
  .option('-p, --path <path>', 'specify directory to scan', process.cwd())
  .parse();

const options = program.opts() as CliOptions;

// Reactアプリをレンダリング（インタラクティブモード）
render(<App cliOptions={options} />);
