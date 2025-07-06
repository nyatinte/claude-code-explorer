import { Box, Text } from 'ink';
import React from 'react';

type HeaderProps = {
  readonly filePath: string;
};

const HeaderDisplay = ({ filePath }: HeaderProps) => (
  <Box marginBottom={1} flexDirection="column">
    <Text bold color="yellow">
      📋 Actions
    </Text>
    <Text dimColor>{filePath}</Text>
  </Box>
);

export const Header = React.memo(HeaderDisplay);
