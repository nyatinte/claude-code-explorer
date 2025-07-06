import { useCallback, useEffect, useState } from 'react';
import type {
  ClaudeFileInfo,
  ClaudeFileType,
  FileGroup,
  ScanOptions,
  SlashCommandInfo,
} from '../_types.js';
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
  fileGroups: FileGroup[];
  selectedFile: NavigationFile | undefined;
  isLoading: boolean;
  error: string | undefined;
  selectFile: (file: NavigationFile) => void;
  toggleGroup: (type: ClaudeFileType) => void;
};

export function useFileNavigation(
  options: ScanOptions = {},
): UseFileNavigationReturn {
  const [files, setFiles] = useState<NavigationFile[]>([]);
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);
  const [selectedFile, setSelectedFile] = useState<
    NavigationFile | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // オブジェクト依存を分解
  const { path, recursive = true } = options;

  useEffect(() => {
    // ファイルスキャン実行
    const scanOptions = { recursive, path };
    Promise.all([scanClaudeFiles(scanOptions), scanSlashCommands(scanOptions)])
      .then(([claudeFiles, slashCommands]) => {
        // スラッシュコマンドをClaudeFileInfo形式に変換
        const convertedCommands = slashCommands.map(
          convertSlashCommandToFileInfo,
        );

        // 両方の結果を結合
        const allFiles = [...claudeFiles, ...convertedCommands];

        // ファイルをタイプごとにグループ化
        const groupedFiles = allFiles.reduce<
          Record<ClaudeFileType, NavigationFile[]>
        >(
          (acc, file) => {
            if (!acc[file.type]) {
              acc[file.type] = [];
            }
            acc[file.type].push(file);
            return acc;
          },
          {} as Record<ClaudeFileType, NavigationFile[]>,
        );

        // 各グループ内でファイル名でソート
        Object.values(groupedFiles).forEach((group) => {
          group.sort((a, b) => {
            const aName = a.path.split('/').pop() || '';
            const bName = b.path.split('/').pop() || '';
            return aName.localeCompare(bName);
          });
        });

        // FileGroup配列を作成（定義済みの順序で）
        const orderedTypes: ClaudeFileType[] = [
          'claude-md',
          'claude-local-md',
          'slash-command',
          'global-md',
          'unknown',
        ];
        const groups: FileGroup[] = orderedTypes
          .filter((type) => groupedFiles[type] && groupedFiles[type].length > 0)
          .map((type) => ({
            type,
            files: groupedFiles[type] || [],
            isExpanded: true, // デフォルトでは全て展開
          }));

        setFileGroups(groups);
        setFiles(allFiles);

        // 最初のファイルを自動選択（最初のグループの最初のファイル）
        if (groups.length > 0 && groups[0] && groups[0].files.length > 0) {
          const firstFile = groups[0].files[0];
          if (firstFile) {
            setSelectedFile(firstFile);
          }
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to scan files:', err);
        setError(err.message || 'Failed to scan files');
        setIsLoading(false);
      });
  }, [path, recursive]);

  const selectFile = useCallback((file: NavigationFile): void => {
    setSelectedFile(file);
  }, []);

  const toggleGroup = useCallback((type: ClaudeFileType): void => {
    setFileGroups((prev) =>
      prev.map((group) =>
        group.type === type
          ? { ...group, isExpanded: !group.isExpanded }
          : group,
      ),
    );
  }, []);

  return {
    files,
    fileGroups,
    selectedFile,
    isLoading,
    error,
    selectFile,
    toggleGroup,
  };
}
