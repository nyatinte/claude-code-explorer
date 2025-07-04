import { useEffect, useState } from 'react';
import type { ClaudeFileInfo, SlashCommandInfo } from '../_types.js';
import { scanClaudeFiles } from '../claude-md-scanner.js';
import { scanSlashCommands } from '../slash-command-scanner.js';

// ClaudeFileInfoとSlashCommandInfoを統一するためのユニオン型
type NavigationFile = ClaudeFileInfo;

// SlashCommandInfoをClaudeFileInfo形式に変換
const convertSlashCommandToFileInfo = (
  command: SlashCommandInfo,
): ClaudeFileInfo => ({
  path: command.filePath,
  type: 'slash-command' as const,
  size: 0, // スラッシュコマンドではサイズ情報がない
  lastModified: command.lastModified,
  projectInfo: undefined,
  commands: [
    {
      name: command.name,
      description: command.description,
      hasArguments: command.hasArguments,
    },
  ],
  tags: command.namespace ? [command.namespace] : [],
});

type UseFileNavigationReturn = {
  files: NavigationFile[];
  selectedFile: NavigationFile | undefined;
  isLoading: boolean;
  error: string | undefined;
  selectFile: (file: NavigationFile) => void;
};

export function useFileNavigation(): UseFileNavigationReturn {
  const [files, setFiles] = useState<NavigationFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<
    NavigationFile | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    // ファイルスキャン実行
    Promise.all([
      scanClaudeFiles({ recursive: true }),
      scanSlashCommands({ recursive: true }),
    ])
      .then(([claudeFiles, slashCommands]) => {
        // スラッシュコマンドをClaudeFileInfo形式に変換
        const convertedCommands = slashCommands.map(
          convertSlashCommandToFileInfo,
        );

        // 両方の結果を結合
        const allFiles = [...claudeFiles, ...convertedCommands];

        // ファイル名でソート
        allFiles.sort((a, b) => {
          const aName = a.path.split('/').pop() || '';
          const bName = b.path.split('/').pop() || '';
          return aName.localeCompare(bName);
        });

        setFiles(allFiles);

        // 最初のファイルを自動選択
        if (allFiles.length > 0) {
          setSelectedFile(allFiles[0]);
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to scan files:', err);
        setError(err.message || 'Failed to scan files');
        setIsLoading(false);
      });
  }, []);

  const selectFile = (file: NavigationFile): void => {
    setSelectedFile(file);
  };

  return {
    files,
    selectedFile,
    isLoading,
    error,
    selectFile,
  };
}
