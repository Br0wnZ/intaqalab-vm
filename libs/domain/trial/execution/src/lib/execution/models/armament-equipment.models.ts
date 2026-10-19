export interface ArmamentEquipmentDenomination {
  id: number | string;
  name: string;
  itemType?: 'WEAPON' | 'TUBE' | 'MORTAR' | 'BUNDLE';
  familyId?: number;
  active?: boolean;
}

export interface ArmamentEquipmentDenominationsResponse {
  totalElements: number;
  items: ArmamentEquipmentDenomination[];
}
