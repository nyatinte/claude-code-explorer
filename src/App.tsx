import { Spinner, StatusMessage } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type React from 'react';
import type { CliOptions } from './_types.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { FileList } from './components/FileList/index.js';
import { SplitPane } from './components/Layout/index.js';
import { Preview } from './components/Preview/index.js';
import { useFileNavigation } from './hooks/index.js';

type AppProps = {
  readonly cliOptions: CliOptions;
};

export function App({ cliOptions }: AppProps): React.JSX.Element {
  const {
    files,
    fileGroups,
    selectedFile,
    isLoading,
    error,
    selectFile,
    toggleGroup,
  } = useFileNavigation({ path: cliOptions.path });

  // エラー状態
  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <StatusMessage variant="error">Error: {error}</StatusMessage>
        <Text dimColor>Press Ctrl+C to exit</Text>
      </Box>
    );
  }

  // ローディング状態
  if (isLoading) {
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

  // ファイルが見つからない場合
  if (files.length === 0) {
    return (
      <Box
        flexDirection="column"
        padding={1}
        justifyContent="center"
        alignItems="center"
      >
        <Text bold color="yellow">
          No Claude files found
        </Text>
        <Text dimColor>Create a CLAUDE.md file to get started</Text>
        <Text dimColor>Press Ctrl+C to exit</Text>
      </Box>
    );
  }

  // メインUI
  return (
    <ErrorBoundary>
      <Box flexDirection="column" width="100%" height="100%">
        {/* ヘッダー */}
        <Box paddingX={1} paddingY={0} borderStyle="single" borderBottom={true}>
          <Text bold color="blue">
            Claude Explorer
          </Text>
          <Text dimColor> | Interactive File Browser</Text>
        </Box>

        {/* メインコンテンツ */}
        <Box flexGrow={1}>
          <SplitPane
            left={
              <ErrorBoundary>
                <FileList
                  files={files}
                  fileGroups={fileGroups}
                  selectedFile={selectedFile}
                  onFileSelect={selectFile}
                  onToggleGroup={toggleGroup}
                />
              </ErrorBoundary>
            }
            right={
              <ErrorBoundary>
                <Preview file={selectedFile} />
              </ErrorBoundary>
            }
            leftWidth={40} // 40% : 60% の比率
          />
        </Box>
      </Box>
    </ErrorBoundary>
  );
}
