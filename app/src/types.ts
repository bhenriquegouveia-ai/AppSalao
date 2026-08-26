export type EventCategory = "palestra" | "workshop" | "networking" | "cerimonia" | string;

export interface EventItem {
  id: string;
  title: string;
  description: string;
  speaker: string | null;
  locationName: string;
  locationMapX: number | null;
  locationMapY: number | null;
  // ISO 8601 com offset (ex: 2026-09-10T12:00:00-03:00), enviado pela API.
  startTime: string;
  endTime: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = "upcoming" | "live" | "ended";
