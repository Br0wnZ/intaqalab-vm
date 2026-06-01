export type DocumentSubtype = {
  id: string;
  name: string;
  label?: string;
  active: boolean;
  category: 'GENERAL' | 'SPECIFIC';
};
