import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventItem } from "../../types";

const CACHE_KEY = "@salao-abrasel/events-cache";

export async function readEventsCache(): Promise<EventItem[] | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as EventItem[];
  } catch {
    return null;
  }
}

export async function writeEventsCache(events: EventItem[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(events));
}
