import { Box, Text } from 'ink';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import type React from 'react';

type MarkdownPreviewProps = {
  readonly content: string;
};

export function MarkdownPreview({
  content,
}: MarkdownPreviewProps): React.JSX.Element {
  try {
    // marked-terminalでMarkdownをターミナル用にレンダリング
    const renderer = new TerminalRenderer({
      // カスタムスタイル設定
      firstHeading: (text: string) => `\n# ${text}\n`,
      heading: (text: string) => `\n## ${text}\n`,
      strong: (text: string) => `**${text}**`,
      em: (text: string) => `*${text}*`,
    });

    marked.setOptions({ renderer });
    const rendered = marked(content);
    return (
      <Box flexDirection="column">
        <Text>{rendered}</Text>
      </Box>
    );
  } catch (_error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Failed to render Markdown</Text>
        <Text>{content}</Text>
      </Box>
    );
  }
}
