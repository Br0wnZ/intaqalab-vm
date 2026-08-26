export interface ExecutionHeaderData {
  code: string;
  client: string;
  project: string;
  status: string;
}

export interface ExecutionShotHistoryItem {
  shot: string;
  status: string;
  timestamp: string;
}

export interface ExecutionShotHistorySeries {
  serie: string;
  shots: ExecutionShotHistoryItem[];
}

export interface ExecutionShotInfo {
  actual: {
    serie: string;
    shot: string;
    percentage: string;
  };
  all: ExecutionShotHistorySeries[];
}
