import { useEffect, useState } from "react";
import { LOCATION, STATUS } from "@/utils/constants";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: LOCATION.timeZone,
});

/** Hour offset of the site owner's zone relative to the viewer's zone. */
function hoursAhead(now: Date) {
  const local = new Date(now.toLocaleString("en-US"));
  const remote = new Date(
    now.toLocaleString("en-US", { timeZone: LOCATION.timeZone }),
  );
  return Math.round(((remote.getTime() - local.getTime()) / 36e5) * 2) / 2;
}

function describeOffset(diff: number) {
  if (diff === 0) return "same time";
  return `${Math.abs(diff)}h ${diff > 0 ? "ahead" : "behind"}`;
}

export default function StatusLine({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className={className}>
      <span>{LOCATION.label}</span>
      <span aria-hidden="true" className="mx-2 text-zinc-600">
        ·
      </span>
      <span className="tabular-nums" suppressHydrationWarning>
        {now ? timeFormatter.format(now) : "--:--:--"}
      </span>
      {now ? (
        <span className="text-zinc-500">{` // ${describeOffset(hoursAhead(now))}`}</span>
      ) : null}
      <span aria-hidden="true" className="mx-2 text-zinc-600">
        ·
      </span>
      <span>{STATUS}</span>
    </p>
  );
}
