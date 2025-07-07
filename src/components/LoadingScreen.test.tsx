import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'vitest';
import { LoadingScreen } from './LoadingScreen.js';

describe('LoadingScreen', () => {
  test('renders without crashing', () => {
    const { lastFrame } = render(<LoadingScreen />);
    const output = lastFrame();

    expect(output).toBeTruthy();
  });

  test('shows spinner after delay', async () => {
    vi.useFakeTimers();
    const { lastFrame, rerender } = render(<LoadingScreen />);

    await vi.advanceTimersByTimeAsync(3100);
    rerender(<LoadingScreen />);

    const output = lastFrame();
    expect(output).toContain('Scanning Claude files...');

    vi.useRealTimers();
  });
});
