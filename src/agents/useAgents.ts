/** Agents data hook — thin async state over services/agents. */
import { useState, useEffect, useCallback } from "react";
import { fetchAgents } from "../services/agents";
import type { AgentSummary } from "./types";

interface AgentsState {
  agents: AgentSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAgents(): AgentsState {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAgents(await fetchAgents());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { agents, loading, error, refresh: load };
}
