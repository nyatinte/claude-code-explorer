#!/usr/bin/env node
import { render } from 'ink';
import { App } from './App.js';

// コマンドライン引数取得
const args = process.argv.slice(2);

// Reactアプリをレンダリング
render(<App args={args} />);
