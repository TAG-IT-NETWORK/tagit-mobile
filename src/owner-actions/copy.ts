/** Screen copy per owner action — one place, so the panel, the screen and the
 *  navigator title never disagree. */
import type { OwnerActionKind } from "./message";
import { RECYCLE_GRACE_HOURS } from "./message";

export type ReasonChip = { label: string; value: string };

export interface OwnerActionCopy {
  title: string;
  /** Short line under the button on the asset page. */
  hint: string;
  /** What happens, shown on the confirm screen. */
  blurb: string;
  icon: "alert-circle-outline" | "pricetag-outline" | "close-circle-outline" | "leaf-outline" | "arrow-undo-outline";
  tone: "warning" | "primary" | "neutral" | "success";
  confirmLabel: string;
  /** Reason chips (flag / recycle) — first is preselected. */
  reasons?: ReasonChip[];
  /** Whether the free-text note is required when the chip is "Other". */
  needsPrice?: boolean;
  doneTitle: string;
}

export const ACTION_COPY: Record<OwnerActionKind, OwnerActionCopy> = {
  flag: {
    title: "Report lost or stolen",
    hint: "Marks the asset as flagged for everyone who taps it",
    blurb:
      "The asset moves to FLAGGED on-chain. Anyone who taps the tag sees the alert, resale is blocked, and the brand reviews the report. Only the brand can clear a flag — you can't undo this from the app.",
    icon: "alert-circle-outline",
    tone: "warning",
    confirmLabel: "Flag this asset",
    reasons: [
      { label: "Lost", value: "lost" },
      { label: "Stolen", value: "stolen" },
      { label: "Suspected counterfeit", value: "suspected counterfeit" },
      { label: "Other", value: "other" },
    ],
    doneTitle: "Asset flagged",
  },
  list: {
    title: "List for sale",
    hint: "Set a USDC price on the TAG IT marketplace",
    blurb:
      "The asset is listed on the TAG IT marketplace at your price. Buyers pay in USDC on Base; on payment the asset transfers to the buyer and the proceeds settle to your wallet. You can remove the listing any time before it sells.",
    icon: "pricetag-outline",
    tone: "primary",
    confirmLabel: "List at this price",
    needsPrice: true,
    doneTitle: "Listed for sale",
  },
  delist: {
    title: "Remove from sale",
    hint: "Take the listing down",
    blurb: "The listing comes off the marketplace immediately. You can list again later.",
    icon: "close-circle-outline",
    tone: "neutral",
    confirmLabel: "Remove listing",
    doneTitle: "Listing removed",
  },
  recycle: {
    title: "Recycle",
    hint: "Retire the asset for good",
    blurb: `Recycling retires the asset permanently (RECYCLED) — the tag stops verifying and the item leaves your vault. To protect you, it runs after a ${RECYCLE_GRACE_HOURS}-hour grace period; you can cancel from the asset page until then.`,
    icon: "leaf-outline",
    tone: "success",
    confirmLabel: "Schedule recycling",
    reasons: [
      { label: "End of life", value: "end of life" },
      { label: "Damaged", value: "damaged beyond repair" },
      { label: "Dropped at a recycling bin", value: "dropped at a recycling bin" },
      { label: "Other", value: "other" },
    ],
    doneTitle: "Recycling scheduled",
  },
  "cancel-recycle": {
    title: "Cancel recycling",
    hint: "Keep the asset",
    blurb: "Cancels the scheduled recycling. The asset stays in your vault exactly as it is.",
    icon: "arrow-undo-outline",
    tone: "neutral",
    confirmLabel: "Cancel recycling",
    doneTitle: "Recycling cancelled",
  },
};

/** Compose the server's `reason` string from a chip + optional note. */
export function composeReason(chip: string, note: string): string {
  const n = note.trim();
  if (!n) return chip;
  return chip === "other" ? n : `${chip}: ${n}`;
}
