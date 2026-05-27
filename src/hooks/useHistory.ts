import { useState, useEffect, useCallback } from "react";
import { getHistory, clearHistory as clearAll } from "../services/history";
import type { ScanRecord } from "../types/challenge";

interface UseHistoryResult {
  records: ScanRecord[];
  loading: boolean;
  refresh: () => void;
  clear: () => Promise<void>;
}

export function useHistory(): UseHistoryResult {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getHistory()
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clear = useCallback(async () => {
    await clearAll();
    setRecords([]);
  }, []);

  return { records, loading, refresh: load, clear };
}
