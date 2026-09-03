import { api } from "../../lib/apiClient";
import { EventItem } from "../../types";

export function fetchFavorites(): Promise<EventItem[]> {
  return api.get<EventItem[]>("/favorites");
}

export function addFavorite(eventId: string): Promise<void> {
  return api.post("/favorites", { event_id: eventId });
}

export function removeFavorite(eventId: string): Promise<void> {
  return api.delete("/favorites", { event_id: eventId });
}
