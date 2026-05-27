/**
 * Shared viem clients for TAG IT.
 *
 * v1 reads almost everything through tagit-services (so RPC keys stay
 * server-side). This client is used for the few direct reads the app does
 * itself — counterfactual smart-account address from the factory, and as a
 * fallback asset read — plus it becomes load-bearing for the AA (UserOp) flow.
 */
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { BASE_SEPOLIA_CHAIN_ID } from "./addresses";

/**
 * Public RPC. Overridable via EXPO_PUBLIC_BASE_SEPOLIA_RPC for a keyed/faster
 * endpoint. The default https://sepolia.base.org works without a key but is
 * rate-limited — fine for occasional reads, not for heavy enumeration (that
 * happens server-side in tagit-services).
 */
const RPC_URL =
  process.env.EXPO_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

// Type is captured from this factory rather than annotated — the bare
// `PublicClient` generic clashes with the concrete baseSepolia (OP-stack)
// chain client, which carries extra transaction types.
const makeClient = () =>
  createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });

let _client: ReturnType<typeof makeClient> | undefined;

export function getPublicClient() {
  return (_client ??= makeClient());
}

export { BASE_SEPOLIA_CHAIN_ID };
