export type MenuAction = {
  key: string;
  label: string;
  description: string;
  action: () => Promise<string>;
};
