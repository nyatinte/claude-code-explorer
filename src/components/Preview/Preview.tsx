import { basename } from 'node:path';
import { Box, Text } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { ClaudeFileInfo } from '../../_types.js';
import { MarkdownPreview } from './MarkdownPreview.js';

type PreviewProps = {
  readonly file?: ClaudeFileInfo | undefined;
};

export function Preview({ file }: PreviewProps): React.JSX.Element {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!file) {
      setContent('');
      return;
    }

    setIsLoading(true);
    setError('');

    // ファイル内容読み込み（非同期）
    import('node:fs/promises')
      .then((fs) => fs.readFile(file.path, 'utf-8'))
      .then((content) => {
        setContent(content);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(`Failed to read file: ${err.message}`);
        setIsLoading(false);
      });
  }, [file]);

  if (!file) {
    return (
      <Box
        flexDirection="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Text dimColor>Select a file to preview</Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        flexDirection="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Text>Loading {basename(file.path)}...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" height="100%" padding={1}>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  const fileName = basename(file.path);

  // 内容を行で分割
  const lines = content.split('\n');
  const totalLines = lines.length;
  const maxPreviewLines = 12; // ヘッダー分を考慮して12行に制限
  const isContentTruncated = totalLines > maxPreviewLines;
  const previewLines = isContentTruncated
    ? lines.slice(0, maxPreviewLines)
    : lines;
  const previewContent = previewLines.join('\n');

  return (
    <Box flexDirection="column" height="100%">
      {/* ファイル情報ヘッダー */}
      <Box
        marginBottom={1}
        borderStyle="single"
        borderBottom={true}
        paddingBottom={1}
      >
        <Box flexDirection="column">
          <Text bold>{fileName}</Text>
          <Text dimColor>{file.path}</Text>
          <Text color="cyan">
            Type: {file.type} | Lines: {totalLines} | Size: {content.length}{' '}
            chars
          </Text>
        </Box>
      </Box>

      {/* プレビュー内容 */}
      <Box
        flexDirection="column"
        height={15} // 15行に制限して左側の一覧が見切れないようにする
        overflow="hidden"
      >
        <Box flexDirection="column" paddingRight={1}>
          {fileName.endsWith('.md') ? (
            <MarkdownPreview content={previewContent} />
          ) : (
            <Text>{previewContent}</Text>
          )}

          {/* 省略表示 */}
          {isContentTruncated && (
            <Box marginTop={1}>
              <Text dimColor italic>
                ... ({totalLines - maxPreviewLines} more lines) ...
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
