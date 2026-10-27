export interface PlanningLoadingZoneItem {
  id: string;
  denominationId?: string;
  denomination?: {
    id: string;
    name: string;
  };
  zone: string[];
  caliber?: number;
  caliberUnit?: string;
  observations?: string;
  active?: boolean;
}

export interface PlanningLoadingZonesResponse {
  page?: number;
  pageSize?: number;
  totalElements?: number;
  items: PlanningLoadingZoneItem[];
}
