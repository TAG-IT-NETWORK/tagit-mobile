export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// iOS-HIG-aligned ramp anchored on a 17pt body (SF "Body"). Every screen
// imports from here, so this block rescales the whole app.
export const fontSize = {
  xs: 13, // captions, pills, badges, meta
  sm: 15, // secondary/supporting body
  md: 17, // DEFAULT BODY — matches iOS SF "Body" 17pt
  lg: 21, // card titles / section headers
  xl: 25, // screen titles
  xxl: 31, // large headings
  hero: 42, // hero/display numerals
} as const;
