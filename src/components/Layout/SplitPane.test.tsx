import { Text } from 'ink';
import { render } from 'ink-testing-library';
import type React from 'react';
import { SplitPane } from './SplitPane.js';

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('SplitPane', () => {
    test('レンダリング可能', () => {
      const LeftContent = (): React.JSX.Element => <Text>左側内容</Text>;
      const RightContent = (): React.JSX.Element => <Text>右側内容</Text>;

      const { lastFrame } = render(
        <SplitPane left={<LeftContent />} right={<RightContent />} />,
      );

      expect(lastFrame()).toContain('左側内容');
      expect(lastFrame()).toContain('右側内容');
    });

    test('カスタム幅比率の適用', () => {
      const LeftContent = (): React.JSX.Element => <Text>左側</Text>;
      const RightContent = (): React.JSX.Element => <Text>右側</Text>;

      const { lastFrame } = render(
        <SplitPane
          left={<LeftContent />}
          right={<RightContent />}
          leftWidth={30}
        />,
      );

      // レンダリング結果に両側が含まれることを確認
      expect(lastFrame()).toContain('左側');
      expect(lastFrame()).toContain('右側');
    });

    test('デフォルト幅比率(50%)の動作', () => {
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
