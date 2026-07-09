export const colors = {
  // ---- Base surfaces (LIGHT) ----------------------------------------
  // Pure-white page; cards/wells step down in gray, separated by hairline
  // borders (Coinbase / ChatGPT minimal model).
  bg: "#FFFFFF",
  surface: "#F7F7F8", // cards, tab bar, headers, secondary panels
  surfaceLight: "#EFEFF1", // nested wells / inputs / pressed states
  border: "#E5E5E7", // hairline dividers & card outlines

  // ---- Text ---------------------------------------------------------
  text: "#0A0A0A", // primary near-black    (19.8:1 on white)
  textSecondary: "#52525B", // supporting text       (7.73:1 on white)
  textMuted: "#64646B", // hints/timestamps/icons (5.87:1 on white)
  textInverse: "#FFFFFF", // foreground ON primary/accent fills (buttons, Tap
  // button, user chat bubble, timeline dots) — REQUIRED.

  // ---- Interactive --------------------------------------------------
  // Black primary for CTAs; ONE restrained accent = deep brand violet for
  // links / active nav / the Tap hero button / selected states.
  primary: "#0A0A0A", // primary buttons, primary icons/text
  primaryDim: "#6D28D9", // solid accent fill (Tap ring, timeline dots) + tint bg
  accent: "#6D28D9", // links, active tab, selected — the one accent (7.10:1)
  accentDim: "#F5F3FF", // accent-tinted background for selected/hover rows

  // ---- Semantic (tuned for WHITE bg) --------------------------------
  // fg tokens pass AA on white AND on their *Dim tint; *Dim tokens are
  // LIGHT TINT BACKGROUNDS (role-flipped from the old dark fills).
  success: "#047857",
  successDim: "#ECFDF5",
  warning: "#B45309",
  warningDim: "#FFFBEB",
  error: "#B91C1C",
  errorDim: "#FEF2F2",

  // ---- Verification -------------------------------------------------
  verified: "#047857",
  unverified: "#B91C1C",
} as const;
