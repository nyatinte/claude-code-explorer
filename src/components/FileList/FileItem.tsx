import { basename, dirname } from 'node:path';
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
  // File type badge color and label
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

  // File type icon
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

  // Get filename and parent directory
  const fileName = basename(file.path);
  const dirPath = dirname(file.path);
  const parentDir = basename(dirPath);

  // Display name (including parent directory)
  // Special handling for home directory
  const displayName =
    file.type === 'global-md'
      ? `~/.claude/${fileName}`
      : file.type === 'slash-command'
        ? fileName.replace('.md', '') // Remove .md for commands
        : `${parentDir}/${fileName}`;

  const prefix = isFocused ? '► ' : '  ';

  const fileBadge = getFileBadge(file);

  return (
    <Box justifyContent="space-between" width="100%">
      <Box>
        {isSelected ? (
          <Text backgroundColor="blue" color="white">
            {prefix}
            {getFileIcon(file)} {displayName}
          </Text>
        ) : isFocused ? (
          <Text color="white">
            {prefix}
            {getFileIcon(file)} {displayName}
          </Text>
        ) : (
          <Text>
            {prefix}
            {getFileIcon(file)} {displayName}
          </Text>
        )}
      </Box>
      <Box>
        <Badge color={fileBadge.color}>{fileBadge.label}</Badge>
      </Box>
    </Box>
  );
});
