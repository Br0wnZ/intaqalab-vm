export interface MasterDataLoadingZone {
  id: string;
  denomination: { id: string; name: string };
  zone: string;
  caliber: number;
  caliberUnit: string;
  active: boolean;
}
