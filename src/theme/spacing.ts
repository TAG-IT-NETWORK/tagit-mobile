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
  xs: 12, // captions, pills, badges, meta (iOS Caption1)
  sm: 14, // secondary/supporting body (iOS Footnote/Subheadline)
  md: 17, // DEFAULT BODY — matches iOS SF "Body" 17pt
  lg: 20, // card titles / section headers (iOS Title3)
  xl: 24, // screen titles (iOS Title2)
  xxl: 30, // large headings (iOS Title1)
  hero: 40, // hero/display numerals (iOS LargeTitle+)
} as const;
