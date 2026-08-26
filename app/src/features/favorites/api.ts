import { api } from "../../lib/apiClient";
import { EventItem } from "../../types";

export function fetchFavorites(deviceId: string): Promise<EventItem[]> {
  return api.get<EventItem[]>(`/favorites/${deviceId}`);
}

export function addFavorite(deviceId: string, eventId: string): Promise<void> {
  return api.post("/favorites", { device_id: deviceId, event_id: eventId });
}

export function removeFavorite(deviceId: string, eventId: string): Promise<void> {
  return api.delete("/favorites", { device_id: deviceId, event_id: eventId });
}
