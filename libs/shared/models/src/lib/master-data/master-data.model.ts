export type MasterData = {
  id: string;
  name: Name;
  label: string;
  active?: boolean;
};

export type Name = {
  es: string;
  en: string;
};

export type TargetDimension = {
  id: string;
  width?: number;
  height?: number;
  diameter?: number;
  label: string;
};

export type TargetThickness = {
  name: string;
  active: boolean;
  id: string;
};
