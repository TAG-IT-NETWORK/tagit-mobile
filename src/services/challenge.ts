import * as Crypto from "expo-crypto";
import { API_URL } from "../config/env";
import type { Challenge } from "../types/challenge";

let cachedDeviceId: string | null = null;

function getDeviceId(): string {
  if (!cachedDeviceId) {
    cachedDeviceId = Crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return cachedDeviceId;
}

/** Generate a challenge nonce for freshness proof */
export async function generateChallenge(): Promise<Challenge> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  const nonce = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    nonce,
    timestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
  };
}

/** HEAD request to API with 3s timeout to check reachability */
export async function checkApiHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_URL}/api/v1/verify`, {
      method: "HEAD",
      signal: controller.signal,
    });
    // Any response (even 405) means server is reachable
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
