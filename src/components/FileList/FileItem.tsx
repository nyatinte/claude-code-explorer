import { basename } from 'node:path';
import { Badge } from '@inkjs/ui';
import { Box, Text } from 'ink';
import React from 'react';
import type { ClaudeFileInfo } from '../../_types.js';

type FileItemProps = {
  readonly file: ClaudeFileInfo;
  readonly isSelected: boolean;
  readonly isFocused: boolean;
};

export const FileItem = React.memo(function FileItem({
  file,
  isSelected,
  isFocused,
}: FileItemProps): React.JSX.Element {
  // ファイル種別バッジの色とラベル
  const getFileBadge = (file: ClaudeFileInfo) => {
    switch (file.type) {
      case 'claude-md':
        return { color: 'blue' as const, label: 'PROJECT' };
      case 'claude-local-md':
        return { color: 'yellow' as const, label: 'LOCAL' };
      case 'slash-command':
        return { color: 'green' as const, label: 'COMMAND' };
      case 'global-md':
        return { color: 'magenta' as const, label: 'GLOBAL' };
      default:
        return { color: 'gray' as const, label: 'FILE' };
    }
  };

  // ファイル種別アイコン
  const getFileIcon = (file: ClaudeFileInfo): string => {
    switch (file.type) {
      case 'claude-md':
        return '📝';
      case 'claude-local-md':
        return '🔒';
      case 'slash-command':
        return '⚡';
      case 'global-md':
        return '🌐';
      default:
        return '📄';
    }
  };

  // ファイル名を取得（パスからbasenameを抽出）
  const fileName = basename(file.path);

  const prefix = isFocused ? '► ' : '  ';

  const fileBadge = getFileBadge(file);

  return (
    <Box justifyContent="space-between" width="100%">
      <Box>
        {isSelected ? (
          <Text backgroundColor="blue" color="white">
            {prefix}
            {getFileIcon(file)} {fileName}
          </Text>
        ) : isFocused ? (
          <Text color="white">
            {prefix}
            {getFileIcon(file)} {fileName}
          </Text>
        ) : (
          <Text>
            {prefix}
            {getFileIcon(file)} {fileName}
          </Text>
        )}
      </Box>
      <Box>
        <Badge color={fileBadge.color}>{fileBadge.label}</Badge>
      </Box>
    </Box>
  );
});
