import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first client render, then `true`.
 *
 * Backed by `useSyncExternalStore` so it avoids the `setState`-in-effect
 * churn of the classic `useState(false)` + `useEffect(() => setState(true))`
 * mount guard.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
