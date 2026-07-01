/**
 * Client for the embedded-wallet email-verification endpoints.
 *   POST /api/v1/wallet/email/start  { email }
 *   POST /api/v1/wallet/email/verify { email, otp }
 *   GET  /api/v1/wallet/email/status?email=
 */
import { API_URL, API_KEY } from "../config/env";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message ?? `HTTP ${res.status}`);
  return json as T;
}

export function startEmailVerification(email: string): Promise<{ sent: boolean; emailHash: string }> {
  return post("/api/v1/wallet/email/start", { email });
}

export function verifyEmailOtp(
  email: string,
  otp: string,
): Promise<{ verified: boolean; emailHash: string; txHash: string }> {
  return post("/api/v1/wallet/email/verify", { email, otp });
}

export async function getEmailStatus(email: string): Promise<boolean> {
  const res = await fetch(
    `${API_URL}/api/v1/wallet/email/status?email=${encodeURIComponent(email)}`,
    { headers: headers() },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { verified?: boolean };
  return json.verified ?? false;
}
