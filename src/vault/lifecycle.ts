/**
 * Pure helpers for mapping the on-chain uint8 lifecycle state to display data.
 * Reuses the canonical names/colors from src/config/constants.ts.
 */
import {
  LIFECYCLE_STATES,
  STATE_DISPLAY_NAMES,
  STATE_COLORS,
  type LifecycleState,
} from "../config/constants";

/** Map a numeric state (0..6) to its enum name, or "UNKNOWN" if out of range. */
export function stateName(code: number): LifecycleState | "UNKNOWN" {
  return (LIFECYCLE_STATES[code] as LifecycleState | undefined) ?? "UNKNOWN";
}

/** Human-friendly label for a numeric state. */
export function stateLabel(code: number): string {
  return STATE_DISPLAY_NAMES[stateName(code)] ?? "Unknown";
}

/** Theme color for a numeric state. */
export function stateColor(code: number): string {
  return STATE_COLORS[stateName(code)] ?? STATE_COLORS.UNKNOWN;
}
