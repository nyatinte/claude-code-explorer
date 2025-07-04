import { Box, Text } from 'ink';
import React from 'react';

type StatusMessageProps = {
  readonly isExecuting: boolean;
  readonly message: string;
};

const StatusMessageDisplay = ({ isExecuting, message }: StatusMessageProps) => (
  <Box marginBottom={1} height={1} minHeight={1}>
    <Text>{isExecuting ? 'Executing...' : message || ' '}</Text>
  </Box>
);

export const StatusMessage = React.memo(StatusMessageDisplay);
