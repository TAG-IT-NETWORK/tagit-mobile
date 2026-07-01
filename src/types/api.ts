import type { Challenge } from "./challenge";

/** Matches tagit-services POST /api/v1/verify request schema */
export interface VerifyRequest {
  tokenId: number;
  nfcPayload: {
    uid: string;   // hex-prefixed: "0x..."
    cmac: string;  // hex-prefixed: "0x..."
    counter: number;
    encFileData?: string;
  };
  challenge?: Challenge;
}

/** Matches tagit-services POST /api/v1/verify response */
export interface VerifyResponse {
  verified: boolean;
  asset: {
    tokenId: string;
    lifecycleState: string;
    stateCode: number;
    owner: string;
    timestamp: number;
  };
  proof: {
    signature: string;
    messageHash: string;
    oracleAddress: string;
    counter: number;
    timestamp: number;
  };
  chain: {
    id: number;
    name: string;
  };
  elapsedMs: number;
}

export interface VerifyErrorResponse {
  error: string;
  statusCode: number;
}
