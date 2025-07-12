import { Box, Text } from 'ink';
import React from 'react';

type HeaderProps = {
  readonly filePath: string;
};

const HeaderDisplay = ({ filePath }: HeaderProps) => {
  // Extract last two parts of the path (parent/filename)
  const pathParts = filePath.split('/');
  const displayPath =
    pathParts.length > 1 ? pathParts.slice(-2).join('/') : filePath;

  return (
    <Box marginBottom={1} flexDirection="column">
      <Text bold color="yellow">
        📋 Actions
      </Text>
      <Text dimColor>{displayPath}</Text>
    </Box>
  );
};

export const Header = React.memo(HeaderDisplay);
