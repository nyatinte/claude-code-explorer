import { dirname, resolve } from 'node:path';
import { useInput } from 'ink';
import { useCallback, useMemo, useState } from 'react';
import type { ClaudeFileInfo } from '../../../../_types.js';
import type { MenuAction } from '../types.js';

type UseMenuProps = {
  readonly file: ClaudeFileInfo;
  readonly onClose: () => void;
};

export const useMenu = ({ file, onClose }: UseMenuProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [message, setMessage] = useState('');

  const copyToClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      const { default: clipboardy } = await import('clipboardy');
      await clipboardy.write(text);
    } catch (error) {
      throw new Error(`Failed to copy to clipboard: ${error}`);
    }
  }, []);

  const openFile = useCallback(async (path: string): Promise<void> => {
    try {
      const open = await import('open');
      await open.default(path);
    } catch (error) {
      throw new Error(`Failed to open file: ${error}`);
    }
  }, []);

  const editFile = useCallback(async (path: string): Promise<void> => {
    try {
      // Check if editor is configured
      const editor = process.env.EDITOR || process.env.VISUAL;
      if (!editor) {
        throw new Error(
          'No editor configured. Please set $EDITOR or $VISUAL environment variable.',
        );
      }

      const openEditor = await import('open-editor');
      await openEditor.default([path]);
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error) {
        // Command not found error
        if (error.message.includes('ENOENT')) {
          const editor = process.env.EDITOR || process.env.VISUAL || 'not set';
          throw new Error(
            `Editor command "${editor}" not found in PATH. ` +
              'Please ensure $EDITOR or $VISUAL is set to a valid command.',
          );
        }
        // Already our custom error
        if (error.message.includes('No editor configured')) {
          throw error;
        }
      }
      throw new Error(`Failed to edit file: ${error}`);
    }
  }, []);

  const actions: MenuAction[] = useMemo(
    () => [
      {
        key: 'c',
        label: 'Copy Content',
        description: 'Copy file content to clipboard',
        action: async () => {
          const fs = await import('node:fs/promises');
          const content = await fs.readFile(file.path, 'utf-8');
          await copyToClipboard(content);
          return '✅ Content copied to clipboard';
        },
      },
      {
        key: 'p',
        label: 'Copy Path (Absolute)',
        description: 'Copy absolute file path to clipboard',
        action: async () => {
          const absolutePath = resolve(file.path);
          await copyToClipboard(absolutePath);
          return '✅ Absolute path copied to clipboard';
        },
      },
      {
        key: 'r',
        label: 'Copy Path (Relative)',
        description: 'Copy relative file path to clipboard',
        action: async () => {
          await copyToClipboard(file.path);
          return '✅ Relative path copied to clipboard';
        },
      },
      {
        key: 'd',
        label: 'Copy Current Directory',
        description: 'Copy directory path to clipboard',
        action: async () => {
          const dirPath = dirname(file.path);
          await copyToClipboard(dirPath);
          return '✅ Directory path copied to clipboard';
        },
      },
      {
        key: 'e',
        label: 'Edit File',
        description: 'Edit file with $EDITOR',
        action: async () => {
          await editFile(file.path);
          return '✅ File opened in editor';
        },
      },
      {
        key: 'o',
        label: 'Open File',
        description: 'Open file with default application',
        action: async () => {
          await openFile(file.path);
          return '✅ File opened';
        },
      },
    ],
    [file.path, copyToClipboard, openFile, editFile],
  );

  const executeAction = useCallback(
    async (action: MenuAction): Promise<void> => {
      setIsExecuting(true);

      try {
        const successMessage = await action.action();
        setMessage(successMessage);
        setTimeout(() => {
          setMessage('');
        }, 2000);
      } catch (error) {
        setMessage(
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } finally {
        setIsExecuting(false);
      }
    },
    [],
  );

  useInput(
    async (input, key) => {
      if (isExecuting) return;

      if (key.escape) {
        onClose();
        return;
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(actions.length - 1, prev + 1));
      } else if (key.return) {
        const action = actions[selectedIndex];
        if (action) {
          await executeAction(action);
        }
      } else if (input) {
        const action = actions.find(
          (a) => a.key.toLowerCase() === input.toLowerCase(),
        );
        if (action) {
          await executeAction(action);
        }
      }
    },
    { isActive: true },
  );

  return {
    actions,
    selectedIndex,
    isExecuting,
    message,
  };
};
