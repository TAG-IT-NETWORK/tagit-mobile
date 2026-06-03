import type { VerifyResponse } from "../types/api";
import type { SunData } from "../types/nfc";
import type { Challenge } from "../types/challenge";

/**
 * Tap-tab stack — the original verify flow. Kept under the name
 * `RootStackParamList` so the existing Home/Result/History screens need no
 * changes. Aliased as `TapStackParamList` for clarity in new code.
 */
export type RootStackParamList = {
  Home: undefined;
  Result: {
    result: VerifyResponse;
    sunData: SunData | null;
    challenge: Challenge | null;
  };
  History: undefined;
  Settings: undefined;
};

export type TapStackParamList = RootStackParamList;

/** Vault tab stack. */
export type VaultStackParamList = {
  VaultList: undefined;
  AssetDetail: { tokenId: string };
};

/** Ask tab stack. Optionally grounded on a specific asset. */
export type AskStackParamList = {
  Chat: { assetTokenId?: string } | undefined;
};

/** Bottom-tab navigator. */
export type RootTabParamList = {
  Vault: undefined;
  Market: undefined;
  Tap: undefined;
  Agents: undefined;
  Ask: undefined;
};
