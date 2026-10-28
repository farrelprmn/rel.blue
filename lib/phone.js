import { useSyncExternalStore } from "react";

export const PHONE =
  "(max-width: 899px) and (orientation: portrait), (orientation: landscape) and (max-height: 559px)";

const subscribe = (cb) => {
  const mq = matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function usePhone() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(PHONE).matches,
    () => false,
  );
}
