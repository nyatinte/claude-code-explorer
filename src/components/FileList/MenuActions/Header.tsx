import { Box, Text } from 'ink';
import React from 'react';

type HeaderProps = {
  readonly filePath: string;
};

const HeaderDisplay = ({ filePath }: HeaderProps) => (
  <Box marginBottom={1}>
    <Text bold color="yellow">
      📋 Action Menu - {filePath}
    </Text>
  </Box>
);

export const Header = React.memo(HeaderDisplay);
