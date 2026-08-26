import { create } from "zustand";
import { EventItem } from "../../types";
import { fetchEvents } from "./api";
import { readEventsCache, writeEventsCache } from "./eventsCache";

interface EventsState {
  events: EventItem[];
  status: "idle" | "loading" | "refreshing" | "error";
  error: string | null;
  loadedFromCache: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

async function fetchAndStore(
  set: (partial: Partial<EventsState>) => void,
  hasCache: boolean
) {
  try {
    const events = await fetchEvents();
    await writeEventsCache(events);
    set({ events, status: "idle", error: null, loadedFromCache: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao carregar eventos";
    // Se já temos dados em cache, não bloqueia a tela — só sinaliza o erro
    // para um banner discreto e mantém o que já estava exibido.
    set({ status: hasCache ? "idle" : "error", error: message });
  }
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  status: "idle",
  error: null,
  loadedFromCache: false,

  load: async () => {
    if (get().status === "loading" || get().events.length > 0) return;

    set({ status: "loading", error: null });

    const cached = await readEventsCache();
    if (cached && cached.length > 0) {
      set({ events: cached, loadedFromCache: true });
    }

    await fetchAndStore(set, Boolean(cached && cached.length > 0));
  },

  refresh: async () => {
    set({ status: "refreshing", error: null });
    await fetchAndStore(set, get().events.length > 0);
  },
}));
