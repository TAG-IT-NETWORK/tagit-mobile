/**
 * Client for the tagit-services agent registry.
 *   GET /api/v1/agents → TAG IT network agents (Sage, Verification, …)
 */
import { API_URL, API_KEY } from "../config/env";
import type { AgentSummary } from "../agents/types";

export class AgentsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AgentsApiError";
  }
}

function authHeaders(): Record<string, string> {
  return API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};
}

interface AgentsListResponse {
  agents: AgentSummary[];
}

/** Fetch the directory of TAG IT network agents. */
export async function fetchAgents(): Promise<AgentSummary[]> {
  const res = await fetch(`${API_URL}/api/v1/agents`, { headers: authHeaders() });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {
      /* ignore */
    }
    throw new AgentsApiError(message, res.status);
  }
  const data = (await res.json()) as AgentsListResponse;
  return data.agents ?? [];
}
