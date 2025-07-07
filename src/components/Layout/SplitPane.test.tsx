import { Text } from 'ink';
import { render } from 'ink-testing-library';
import type React from 'react';
import { SplitPane } from './SplitPane.js';

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('SplitPane', () => {
    test('renders correctly', () => {
      const LeftContent = (): React.JSX.Element => <Text>Left Content</Text>;
      const RightContent = (): React.JSX.Element => <Text>Right Content</Text>;

      const { lastFrame } = render(
        <SplitPane left={<LeftContent />} right={<RightContent />} />,
      );

      expect(lastFrame()).toContain('Left Content');
      expect(lastFrame()).toContain('Right Content');
    });

    test('applies custom width ratio', () => {
      const LeftContent = (): React.JSX.Element => <Text>Left</Text>;
      const RightContent = (): React.JSX.Element => <Text>Right</Text>;

      const { lastFrame } = render(
        <SplitPane
          left={<LeftContent />}
          right={<RightContent />}
          leftWidth={30}
        />,
      );

      // Verify both sides are included in render output
      expect(lastFrame()).toContain('Left');
      expect(lastFrame()).toContain('Right');
    });

    test('uses default 50% width ratio', () => {
      const LeftContent = (): React.JSX.Element => <Text>Default Left</Text>;
      const RightContent = (): React.JSX.Element => <Text>Default Right</Text>;

      const { lastFrame } = render(
        <SplitPane left={<LeftContent />} right={<RightContent />} />,
      );

      expect(lastFrame()).toContain('Default Left');
      expect(lastFrame()).toContain('Default Right');
    });
  });
}
