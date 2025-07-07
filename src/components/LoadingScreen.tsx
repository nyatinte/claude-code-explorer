import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import type React from 'react';
import { useEffect, useState } from 'react';

export function LoadingScreen(): React.JSX.Element {
  const [showLogo, setShowLogo] = useState(true);
  const [palette, setPalette] = useState(0);

  const palette1 = ['#4ea8ff', '#7f88ff'];
  const palette2 = ['#ff9966', '#ff5e62', '#ffa34e'];
  const palette3 = ['#667eea', '#764ba2'];
  const palette4 = ['#ff0844', '#ffb199'];
  const palette5 = ['#134e5e', '#71b280'];
  const palette6 = ['#f7971e', '#ffd200'];
  const paletteMap = {
    0: palette1,
    1: palette2,
    2: palette3,
    3: palette4,
    4: palette5,
    5: palette6,
  };

  const selectedPalette = paletteMap[(palette % 6) as keyof typeof paletteMap];

  useEffect(() => {
    const interval = setInterval(() => {
      setPalette((prev) => (prev + 1) % 6);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
        <Gradient colors={selectedPalette}>
          <BigText text="CLAUDE" font="chrome" />
        </Gradient>
        <Gradient colors={selectedPalette}>
          <BigText text="EXPLORER" font="chrome" />
        </Gradient>
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
