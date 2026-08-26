import { useEffect, useState } from "react";
import { getEventStatus, msUntil, toCountdown } from "../../lib/dateTime";
import { EventItem, EventStatus } from "../../types";

export interface CountdownState {
  status: EventStatus;
  countdown: ReturnType<typeof toCountdown>;
}

export function useCountdown(event: Pick<EventItem, "startTime" | "endTime">): CountdownState {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = getEventStatus(event, now);
  const target = status === "upcoming" ? event.startTime : event.endTime;

  return {
    status,
    countdown: toCountdown(msUntil(target, now)),
  };
}
