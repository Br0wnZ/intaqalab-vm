export type StanagVariable = 'WIND_DIRECTION' | 'WIND_SPEED' | 'TEMPERATURE' | 'PRESSURE' | 'DENSITY';

export type StanagUnit =
  | 'DEGREES'
  | 'THOUSANDTHS'
  | 'M_S'
  | 'KM_H'
  | 'KNOTS'
  | 'CELSIUS'
  | 'KELVIN'
  | 'BAR'
  | 'MPA'
  | 'PERCENT';

export type StanagCalculationType = 'SINGLE_VALUE' | 'LAYER_DIFFERENCE' | 'CONSECUTIVE_LAYERS';

export type StanagInvolvedLayer =
  | 'SURFACE'
  | 'APPROXIMATE_HEIGHT'
  | 'MAX_WIND_LEVEL'
  | 'CONSECUTIVE_LAYERS'
  | 'BETWEEN_TWO_HEIGHTS';

export type StanagCriterionItem = {
  id: string;
  name: Record<string, string>;
  label: string;
  variable: StanagVariable;
  numericThreshold: number;
  unit: StanagUnit;
  calculationType: StanagCalculationType;
  involvedLayer: StanagInvolvedLayer;
  startLayer?: number;
  endLayer?: number;
  maxArrow?: boolean;
  active: boolean;
};

export type StanagCriterionRequest = {
  name: Record<string, string>;
  variable: StanagVariable;
  numericThreshold: number;
  unit: StanagUnit;
  calculationType: StanagCalculationType;
  involvedLayer: StanagInvolvedLayer;
  startLayer?: number;
  endLayer?: number;
  maxArrow?: boolean;
  active?: boolean;
};

export type StanagCriteriaListResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: StanagCriterionItem[];
};
