import { Box, Text } from 'ink';
import React from 'react';

const FooterDisplay = () => (
  <Box borderStyle="single" borderTop={true} paddingTop={1}>
    <Text dimColor>
      ↑↓: Navigate | Enter: Execute | [Key]: Direct action | Esc: Close
    </Text>
  </Box>
);

export const Footer = React.memo(FooterDisplay);
