import { useCallback, useSyncExternalStore } from "react";

// re-reads a time-based value every `every` ms on the client; the server renders `server`.
// `read` must return a primitive (a string here) so React can tell when it actually changed.
function useTicking(read, every, server) {
  const subscribe = useCallback(
    (onTick) => {
      const id = setInterval(onTick, every);
      return () => clearInterval(id);
    },
    [every],
  );
  return useSyncExternalStore(subscribe, read, () => server);
}

// visitor's own local time plus their zone label, e.g. "19:42 GMT+7"
function tick() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const zone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName")?.value;
  return zone ? `${time} ${zone}` : time;
}

export function Clock() {
  return <span>{useTicking(tick, 1000, "--:--")}</span>;
}

// greeting follows the visitor's own clock: pagi 04-10, siang 11-14, sore 15-17, malam 18-03
const GREETS = {
  pagi: ["Good morning", "04:00 – 10:59"],
  siang: ["Good day", "11:00 – 14:59"],
  sore: ["Good afternoon", "15:00 – 17:59"],
  malam: ["Good night", "18:00 – 03:59"],
};

function currentWord() {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return "pagi";
  if (h >= 11 && h < 15) return "siang";
  if (h >= 15 && h < 18) return "sore";
  return "malam";
}

export function Greeting() {
  const word = useTicking(currentWord, 60000, "malam");
  const [meaning, hours] = GREETS[word];
  // data-* feeds the InfoCard popup
  return (
    <span
      className="greet"
      tabIndex={0}
      data-role={`Selamat ${word}`}
      data-period={hours}
      data-text={`means "${meaning}" in Indonesian. Picked from your local time.`}
    >
      {word}
    </span>
  );
}
