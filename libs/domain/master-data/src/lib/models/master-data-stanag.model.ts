export interface MasterDataStanag {
  id: string;
  variable: { id: string; name: string };
  description: string;
  numThreshold: number;
  measureUnit: { id: string; name: string };
  calcType: { id: string; name: string };
  involvedLayers: { id: string; name: string };
  startLayer: string;
  endLayer: string;
  active: boolean;
}
