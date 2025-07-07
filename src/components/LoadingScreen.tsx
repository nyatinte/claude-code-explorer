import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import type React from 'react';
import { useEffect, useState } from 'react';

export function LoadingScreen(): React.JSX.Element {
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showLogo) {
    return (
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        width="100%"
        height="100%"
      >
        <Box flexDirection="column" alignItems="center">
          <Gradient colors={['#ff9966', '#ff5e62']}>
            <BigText text="CLAUDE CODE" font="block" />
          </Gradient>
          <Gradient colors={['#ff9966', '#ff5e62']}>
            <BigText text="EXPLORER" font="block" />
          </Gradient>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Loading...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      padding={1}
      justifyContent="center"
      alignItems="center"
    >
      <Spinner label="Scanning Claude files..." />
      <Text dimColor>Please wait...</Text>
    </Box>
  );
}
