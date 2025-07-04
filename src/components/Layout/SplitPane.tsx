import { Box } from 'ink';
import type React from 'react';

type SplitPaneProps = {
  readonly left: React.ReactNode;
  readonly right: React.ReactNode;
  readonly leftWidth?: number; // 0-100の範囲で左ペインの幅をパーセンテージで指定
};

export function SplitPane({
  left,
  right,
  leftWidth = 50,
}: SplitPaneProps): React.JSX.Element {
  // パーセンテージの妥当性チェック
  const validLeftWidth = Math.max(0, Math.min(100, leftWidth));
  const rightWidth = 100 - validLeftWidth;

  return (
    <Box flexDirection="row" width="100%" height="100%">
      {/* 左ペイン: ファイル一覧 */}
      <Box
        width={`${validLeftWidth}%`}
        height="100%"
        borderStyle="single"
        borderRight={true}
        borderLeft={false}
        borderTop={false}
        borderBottom={false}
        paddingX={1}
      >
        {left}
      </Box>

      {/* 右ペイン: プレビュー */}
      <Box width={`${rightWidth}%`} height="100%" paddingX={1}>
        {right}
      </Box>
    </Box>
  );
}
