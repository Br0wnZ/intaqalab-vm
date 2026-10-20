export interface DenominationOption {
  value: string;
  label: string;
  munitionTypeId: string;
  planned: boolean;
  inStock: boolean;
  batch?: string | null;
  clientNumber?: string | null;
}

export interface BatchOption {
  value: string;
  label: string;
  denominationId: string;
  quantity: number;
  planned: boolean;
  inStock: boolean;
}
