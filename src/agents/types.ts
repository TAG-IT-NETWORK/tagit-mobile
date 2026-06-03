/** A capability exposed by a TAG IT network agent. */
export interface AgentSkill {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  price?: number | null;
}

/** A TAG IT network agent (from GET /api/v1/agents). */
export interface AgentSummary {
  agentId: number;
  name: string;
  type: string;
  description?: string;
  skills?: AgentSkill[];
}
