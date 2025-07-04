import { dirname, resolve } from 'node:path';
import { Box, Text, useFocus, useInput } from 'ink';
import type React from 'react';
import { useState } from 'react';
import type { ClaudeFileInfo } from '../../_types.js';

type MenuAction = {
  key: string;
  label: string;
  description: string;
  action: () => Promise<void> | void;
};

type MenuActionsProps = {
  readonly file: ClaudeFileInfo;
  readonly onClose: () => void;
};

export function MenuActions({
  file,
  onClose,
}: MenuActionsProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [message, setMessage] = useState('');
  const { isFocused } = useFocus({ autoFocus: true });

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      const { writeText } = await import('clipboardy');
      await writeText(text);
    } catch (error) {
      throw new Error(`Failed to copy to clipboard: ${error}`);
    }
  };

  const openFile = async (path: string): Promise<void> => {
    try {
      const open = await import('open');
      await open.default(path);
    } catch (error) {
      throw new Error(`Failed to open file: ${error}`);
    }
  };

  const actions: MenuAction[] = [
    {
      key: 'c',
      label: 'Copy Content',
      description: 'Copy file content to clipboard',
      action: async () => {
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(file.path, 'utf-8');
        await copyToClipboard(content);
        setMessage('✅ Content copied to clipboard');
      },
    },
    {
      key: 'p',
      label: 'Copy Path (Absolute)',
      description: 'Copy absolute file path to clipboard',
      action: async () => {
        const absolutePath = resolve(file.path);
        await copyToClipboard(absolutePath);
        setMessage('✅ Absolute path copied to clipboard');
      },
    },
    {
      key: 'r',
      label: 'Copy Path (Relative)',
      description: 'Copy relative file path to clipboard',
      action: async () => {
        await copyToClipboard(file.path);
        setMessage('✅ Relative path copied to clipboard');
      },
    },
    {
      key: 'd',
      label: 'Copy Current Directory',
      description: 'Copy directory path to clipboard',
      action: async () => {
        const dirPath = dirname(file.path);
        await copyToClipboard(dirPath);
        setMessage('✅ Directory path copied to clipboard');
      },
    },
    {
      key: 'o',
      label: 'Open File',
      description: 'Open file with default application',
      action: async () => {
        await openFile(file.path);
        setMessage('✅ File opened');
      },
    },
  ];

  const executeAction = async (action: MenuAction): Promise<void> => {
    setIsExecuting(true);
    setMessage('');

    try {
      await action.action();
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1500);
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
  };

  useInput(async (input, key) => {
    if (!isFocused || isExecuting) return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(actions.length - 1, prev + 1));
    } else if (key.return) {
      await executeAction(actions[selectedIndex]);
    } else if (input) {
      // キーボードショートカット
      const action = actions.find(
        (a) => a.key.toLowerCase() === input.toLowerCase(),
      );
      if (action) {
        await executeAction(action);
      }
    }
  });

  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="yellow">
          📋 Action Menu - {file.path}
        </Text>
      </Box>

      {message && (
        <Box marginBottom={1}>
          <Text>{message}</Text>
        </Box>
      )}

      <Box flexDirection="column" marginBottom={1}>
        {actions.map((action, index) => (
          <Box key={action.key}>
            <Text
              backgroundColor={index === selectedIndex ? 'blue' : undefined}
              color={index === selectedIndex ? 'white' : undefined}
            >
              {index === selectedIndex ? '► ' : '  '}[{action.key.toUpperCase()}
              ] {action.label}
            </Text>
          </Box>
        ))}
      </Box>

      <Box borderStyle="single" borderTop={true} paddingTop={1}>
        <Text dimColor>
          {isExecuting
            ? 'Executing...'
            : '↑↓: Navigate | Enter: Execute | [Key]: Direct action | Esc: Close'}
        </Text>
      </Box>
    </Box>
  );
}
