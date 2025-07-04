import { basename } from 'node:path';
import { TextInput } from '@inkjs/ui';
import { Box, Text, useFocus, useInput } from 'ink';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { ClaudeFileInfo } from '../../_types.js';
import { FileItem } from './FileItem.js';
import { MenuActions } from './MenuActions/index.js';

type FileListProps = {
  readonly files: ClaudeFileInfo[];
  readonly onFileSelect: (file: ClaudeFileInfo) => void;
  readonly selectedFile?: ClaudeFileInfo | undefined;
};

export function FileList({
  files,
  onFileSelect,
  selectedFile: _selectedFile,
}: FileListProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuMode, setIsMenuMode] = useState(false);
  const { isFocused } = useFocus({ autoFocus: true });

  // 検索フィルタリング（メモ化）
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;

    return files.filter((file) => {
      const fileName = basename(file.path);
      return (
        fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [files, searchQuery]);

  // 検索クエリが変更されたときにcurrentIndexをリセット
  useEffect(() => {
    setCurrentIndex(0);
  }, []);

  // ファイルリストが変更されたときにcurrentIndexを調整
  useEffect(() => {
    if (filteredFiles.length > 0 && currentIndex >= filteredFiles.length) {
      setCurrentIndex(0);
    }
  }, [filteredFiles.length, currentIndex]);

  // currentIndexが変更されたときにリアルタイムでファイル選択を更新
  useEffect(() => {
    const currentFile = filteredFiles[currentIndex];
    if (currentFile) {
      onFileSelect(currentFile);
    }
  }, [currentIndex, filteredFiles, onFileSelect]);

  // キーボード操作
  useInput(
    (_input, key) => {
      // 検索フィールドフォーカス中は処理しない
      if (isSearchFocused || isMenuMode) return;

      if (key.escape) {
        process.exit(0);
        return;
      }

      if (key.tab) {
        setIsSearchFocused(true);
        return;
      }

      // ファイルナビゲーション
      if (key.upArrow) {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setCurrentIndex((prev) => Math.min(filteredFiles.length - 1, prev + 1));
      } else if (key.return) {
        // Enterキーでメニューモード切り替え
        if (filteredFiles[currentIndex]) {
          setIsMenuMode(true);
        }
      }
    },
    { isActive: isFocused && !isMenuMode && !isSearchFocused },
  );

  return (
    <Box flexDirection="column" height="100%">
      {/* ヘッダー - 常に表示 */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Claude Files ({isMenuMode ? files.length : filteredFiles.length})
        </Text>
      </Box>

      {/* 検索入力 - メニューモード時は無効化 */}
      <Box marginBottom={1}>
        <TextInput
          placeholder="Type to filter files..."
          defaultValue={searchQuery}
          onChange={setSearchQuery}
          onSubmit={() => {
            setIsSearchFocused(false);
          }}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          isDisabled={isMenuMode}
        />
      </Box>

      {/* ファイル一覧 - メニューモード時は非表示だが存在 */}
      <Box
        flexDirection="column"
        flexGrow={1}
        height={isMenuMode ? 0 : undefined}
      >
        {!isMenuMode &&
          (filteredFiles.length === 0 ? (
            <Text dimColor>No files found</Text>
          ) : (
            filteredFiles.map((file, index) => (
              <FileItem
                key={`${file.path}-${index}`}
                file={file}
                isSelected={index === currentIndex}
                isFocused={index === currentIndex && isFocused && !isMenuMode}
              />
            ))
          ))}
      </Box>

      {/* メニューアクション - メニューモード時のみ表示 */}
      {isMenuMode && filteredFiles[currentIndex] && (
        <Box flexGrow={1}>
          <MenuActions
            file={filteredFiles[currentIndex]}
            onClose={() => setIsMenuMode(false)}
          />
        </Box>
      )}

      {/* フッター - 常に表示 */}
      <Box marginTop={1} borderStyle="single" borderTop={true}>
        <Text dimColor>
          ↑↓: Navigate | Enter: Menu | Tab: Search | Esc: Exit
        </Text>
      </Box>
    </Box>
  );
}
