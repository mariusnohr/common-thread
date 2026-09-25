"use client";

import { useEffect, useState } from "react";
import { secondsUntilOsloMidnight } from "@/lib/puzzle/oslo";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Time left until the next day's puzzles, ticking every second. */
export function Countdown() {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setSeconds(secondsUntilOsloMidnight());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (seconds === null) return <span className="countdown">--:--:--</span>;
  if (seconds <= 1) {
    return (
      <button
        type="button"
        className="btn-link countdown ready"
        onClick={() => window.location.assign("/")}
      >
        nå, last inn på nytt
      </button>
    );
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return (
    <span className="countdown" aria-label={`${hours} timer og ${minutes} minutter`}>
      {pad(hours)}:{pad(minutes)}:{pad(seconds % 60)}
    </span>
  );
}
