import { Role } from '@intaqalab/core';
import type { IntaIconName } from '@intaqalab/ui';

export type MenuAction =
  | 'TRIAL_NEW'
  | 'TRIAL_LIST'
  | 'CALENDAR_TRIALS'
  | 'BLANK_2'
  | 'DEMO'
  | 'MASTER_DATA_TRIAL_TYPE'
  | 'MASTER_DATA_DOCUMENT_TYPE'
  | 'MASTER_DATA_TARGET_TYPE'
  | 'MASTER_DATA_MATERIAL'
  | 'MASTER_DATA_DIMENSION'
  | 'MASTER_DATA_FUZE_TYPE'
  | 'MASTER_DATA_LOADING_ZONE'
  | 'MASTER_DATA_STANAG'
  | 'WHAREHOUSE_MUNITION_NEW'
  | 'WHAREHOUSE_MUNITION_STOCK'
  | 'WHAREHOUSE_MUNITIONS_DUMPS'
  | 'WHAREHOUSE_DENOMINATIONS'
  | 'WHAREHOUSE_MUNITIONS_COMPONENTS'
  | 'EVENT_LOG'
  | 'EXECUTION';

export interface MenuNode {
  name: string;
  children?: MenuNode[];
  id?: MenuAction;
  icon?: string;
  iconName?: IntaIconName;
  roles?: Role[];
}

export const ACTION_ROUTES: Partial<Record<MenuAction, string>> = {
  DEMO: '/demos',
  MASTER_DATA_TRIAL_TYPE: '/master-data/trial-type',
  MASTER_DATA_DOCUMENT_TYPE: '/master-data/document-type',
  MASTER_DATA_TARGET_TYPE: '/master-data/target-type',
  MASTER_DATA_MATERIAL: '/master-data/material',
  MASTER_DATA_DIMENSION: '/master-data/dimension',
  MASTER_DATA_FUZE_TYPE: '/master-data/fuze-type',
  MASTER_DATA_LOADING_ZONE: '/master-data/loading-zone',
  MASTER_DATA_STANAG: '/master-data/stanag',
  WHAREHOUSE_MUNITION_NEW: '/wharehouse-managment/munitions',
  WHAREHOUSE_MUNITION_STOCK: '/wharehouse-managment/stock',
  WHAREHOUSE_MUNITIONS_DUMPS: '/wharehouse-managment/munitions-dumps',
  WHAREHOUSE_DENOMINATIONS: '/wharehouse-managment/denominations',
  WHAREHOUSE_MUNITIONS_COMPONENTS: '/wharehouse-managment/munition-components',
  EVENT_LOG: '/event-log',
  EXECUTION: '/execution',
};

export const URL_ACTION_MAP: ReadonlyArray<{ startsWith: string; action: MenuAction }> = [
  { startsWith: '/demos', action: 'DEMO' },
  { startsWith: '/calendar-trials', action: 'CALENDAR_TRIALS' },
  { startsWith: '/master-data/trial-type', action: 'MASTER_DATA_TRIAL_TYPE' },
  { startsWith: '/master-data/document-type', action: 'MASTER_DATA_DOCUMENT_TYPE' },
  { startsWith: '/master-data/target-type', action: 'MASTER_DATA_TARGET_TYPE' },
  { startsWith: '/master-data/material', action: 'MASTER_DATA_MATERIAL' },
  { startsWith: '/master-data/dimension', action: 'MASTER_DATA_DIMENSION' },
  { startsWith: '/master-data/fuze-type', action: 'MASTER_DATA_FUZE_TYPE' },
  { startsWith: '/master-data/loading-zone', action: 'MASTER_DATA_LOADING_ZONE' },
  { startsWith: '/master-data/stanag', action: 'MASTER_DATA_STANAG' },
  { startsWith: '/event-log', action: 'EVENT_LOG' },
  { startsWith: '/execution', action: 'EXECUTION' },
];

const TRIAL_CHILD_SVG = 'rocket';

export const MENU_TREE: MenuNode[] = [
  {
    name: 'MENU_LEFT.GESTION_TRIALS',
    iconName: 'file',
    roles: [
      Role.INTAQALAB_ADMIN,
      Role.HEAD_ARMAMENT_TRIALS,
      Role.INTAQALAB_TRIAL_ENGINEER,
      Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
      Role.INTAQALAB_SHOOTING_LINE_HEAD,
      Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
      Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
      Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
      Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
      Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
      Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
      Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
      Role.INTAQALAB_TRIAL_CONSULTANT,
      Role.INTAQALAB_VIEWER,
    ],
    children: [
      {
        name: 'MENU_LEFT.GESTION_TRIALS_NEW',
        iconName: TRIAL_CHILD_SVG,
        id: 'TRIAL_NEW',
        roles: [
          Role.INTAQALAB_ADMIN,
          Role.HEAD_ARMAMENT_TRIALS,
          Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
          Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
          Role.INTAQALAB_TRIAL_CONSULTANT,
        ],
      },
      { name: 'MENU_LEFT.GESTION_TRIALS_LIST', iconName: TRIAL_CHILD_SVG, id: 'TRIAL_LIST' },
    ],
  },
  {
    name: 'MENU_LEFT.CALENDAR_TRIALS',
    id: 'CALENDAR_TRIALS',
    iconName: 'calendar',
    roles: [
      Role.INTAQALAB_ADMIN,
      Role.HEAD_ARMAMENT_TRIALS,
      Role.INTAQALAB_TRIAL_ENGINEER,
      Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
      Role.INTAQALAB_SHOOTING_LINE_HEAD,
      Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
      Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
      Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
      Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
      Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
      Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
      Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
      Role.INTAQALAB_TRIAL_CONSULTANT,
      Role.INTAQALAB_VIEWER,
    ],
  },
  {
    name: 'MENU_LEFT.WHAREHOUSE.TITLE',
    iconName: 'truck',
    roles: [
      Role.INTAQALAB_ADMIN,
      Role.HEAD_ARMAMENT_TRIALS,
      Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
      Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
    ],
    children: [
      { name: 'MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITION_NEW', iconName: TRIAL_CHILD_SVG, id: 'WHAREHOUSE_MUNITION_NEW' },
      {
        name: 'MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITION_STOCK',
        iconName: TRIAL_CHILD_SVG,
        id: 'WHAREHOUSE_MUNITION_STOCK',
      },
      {
        name: 'MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITIONS_DUMPS',
        iconName: TRIAL_CHILD_SVG,
        id: 'WHAREHOUSE_MUNITIONS_DUMPS',
      },
      { name: 'MENU_LEFT.WHAREHOUSE.OPTIONS.DENOMINATIONS', iconName: TRIAL_CHILD_SVG, id: 'WHAREHOUSE_DENOMINATIONS' },
      {
        name: 'MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITIONS_COMPONENTS',
        iconName: TRIAL_CHILD_SVG,
        id: 'WHAREHOUSE_MUNITIONS_COMPONENTS',
      },
    ],
  },
  {
    name: 'MENU_LEFT.EVENT_LOG',
    id: 'EVENT_LOG',
    iconName: 'eventLog',
    roles: [Role.INTAQALAB_ADMIN, Role.HEAD_ARMAMENT_TRIALS, Role.INTAQALAB_TRIAL_CONSULTANT],
  },
  {
    name: 'MENU_LEFT.EXECUTION',
    id: 'EXECUTION',
    iconName: 'eventLog',
    roles: [
      Role.INTAQALAB_ADMIN,
      Role.HEAD_ARMAMENT_TRIALS,
      Role.INTAQALAB_TRIAL_ENGINEER,
      Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
      Role.INTAQALAB_SHOOTING_LINE_HEAD,
      Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
      Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
      Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
      Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
      Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
      Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
      Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
      Role.INTAQALAB_TRIAL_CONSULTANT,
      Role.INTAQALAB_VIEWER,
    ],
  },
  {
    name: 'MENU_LEFT.CATALOG.TITLE',
    iconName: 'catalog',
    roles: [Role.INTAQALAB_ADMIN, Role.HEAD_ARMAMENT_TRIALS],
    children: [
      { name: 'MENU_LEFT.CATALOG.OPTIONS.TRIAL_TYPE', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_TRIAL_TYPE' },
      { name: 'MENU_LEFT.CATALOG.OPTIONS.DOCUMENT_TYPE', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_DOCUMENT_TYPE' },
      { name: 'MENU_LEFT.CATALOG.OPTIONS.TARGET_TYPE', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_TARGET_TYPE' },
      { name: 'MENU_LEFT.CATALOG.OPTIONS.MATERIAL', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_MATERIAL' },
      { name: 'MENU_LEFT.CATALOG.OPTIONS.DIMENSION', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_DIMENSION' },
      { name: 'MENU_LEFT.CATALOG.OPTIONS.FUZE_TYPE', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_FUZE_TYPE' },
      { name: 'MENU_LEFT.CATALOG.OPTIONS.LOADING_ZONE', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_LOADING_ZONE' },
      { name: 'MENU_LEFT.CATALOG.OPTIONS.STANAG', iconName: TRIAL_CHILD_SVG, id: 'MASTER_DATA_STANAG' },
    ],
  }
];
