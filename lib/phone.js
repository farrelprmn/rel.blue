import { useSyncExternalStore } from "react";

// the phone layout's media query, the same one as the phone header block in globals.css
export const PHONE =
  "(max-width: 899px) and (orientation: portrait), (orientation: landscape) and (max-height: 559px)";

const subscribe = (cb) => {
  const mq = matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

// true while the phone layout applies; false on the server, where there's no screen to ask
export function usePhone() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(PHONE).matches,
    () => false,
  );
}
