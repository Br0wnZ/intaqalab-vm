export interface MasterDataStanag {
  id: string;
  variable: string;
  name: { es: string; en: string };
  numericThreshold: number;
  unit: string;
  calculationType: string;
  involvedLayer: string;
  startLayer: number | null;
  endLayer: number | null;
  active: boolean;
}
