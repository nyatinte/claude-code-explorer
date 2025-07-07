import { Text } from 'ink';
import { render } from 'ink-testing-library';
import type React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { LoadingScreen } from './LoadingScreen.js';

vi.mock('ink-big-text', () => ({
  default: () => <Text>Logo</Text>,
}));

vi.mock('ink-gradient', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LoadingScreen', () => {
  test('renders without crashing', () => {
    const { lastFrame } = render(<LoadingScreen />);
    const output = lastFrame();

    // 基本的にレンダリングされることを確認
    expect(output).toBeTruthy();
  });

  test('shows spinner after delay', async () => {
    vi.useFakeTimers();
    const { lastFrame, rerender } = render(<LoadingScreen />);

    // 3秒後にスピナーが表示される
    await vi.advanceTimersByTimeAsync(3100);
    rerender(<LoadingScreen />);

    const output = lastFrame();
    expect(output).toContain('Scanning Claude files...');

    vi.useRealTimers();
  });
});
