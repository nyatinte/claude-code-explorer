import { Box } from 'ink';
import React from 'react';
import { MenuItem } from './MenuItem.js';
import type { MenuAction } from './types.js';

type MenuListProps = {
  readonly actions: MenuAction[];
  readonly selectedIndex: number;
};

const MenuListDisplay = ({ actions, selectedIndex }: MenuListProps) => (
  <Box flexDirection="column" marginBottom={1}>
    {actions.map((action, index) => (
      <MenuItem
        key={action.key}
        action={action}
        isSelected={index === selectedIndex}
      />
    ))}
  </Box>
);

export const MenuList = React.memo(MenuListDisplay);
