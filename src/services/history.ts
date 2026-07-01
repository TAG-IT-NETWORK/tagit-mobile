import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ScanRecord } from "../types/challenge";

const HISTORY_KEY = "tagit:scan_history";
const MAX_RECORDS = 20;

/** Retrieve scan history from AsyncStorage */
export async function getHistory(): Promise<ScanRecord[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ScanRecord[];
  } catch {
    return [];
  }
}

/** Prepend a scan record and trim to max */
export async function addToHistory(record: ScanRecord): Promise<void> {
  const existing = await getHistory();
  const updated = [record, ...existing].slice(0, MAX_RECORDS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

/** Clear all scan history */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
