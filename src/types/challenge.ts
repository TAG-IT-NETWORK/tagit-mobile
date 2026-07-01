/** Client-side challenge for freshness proof */
export interface Challenge {
  nonce: string;
  timestamp: string;
  deviceId: string;
}

/** Persisted scan history record */
export interface ScanRecord {
  id: string;
  timestamp: string;
  tokenId: number;
  verified: boolean;
  lifecycleState: string;
  chainName: string;
  elapsedMs: number;
  challenge: Challenge;
  sunData: {
    uid: string;
    ctr: string;
    cmac: string;
  } | null;
}
