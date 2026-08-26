import { api } from "../../lib/apiClient";
import { EventItem } from "../../types";

export interface EventListFilters {
  date?: string; // YYYY-MM-DD
  category?: string;
}

function buildQuery(filters: EventListFilters): string {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.category) params.set("category", filters.category);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function fetchEvents(filters: EventListFilters = {}): Promise<EventItem[]> {
  return api.get<EventItem[]>(`/events${buildQuery(filters)}`);
}

export function fetchEventById(id: string): Promise<EventItem> {
  return api.get<EventItem>(`/events/${id}`);
}
