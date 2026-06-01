export const INTA_ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export type IntaIconSize = keyof typeof INTA_ICON_SIZES;
