"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Renders children at the end of <body>.
 *
 * Overlays must escape the header: it uses `backdrop-filter`, and any element
 * with a filter, transform or perspective becomes the containing block for
 * `position: fixed` descendants. A drawer rendered inside it would be clipped
 * to the header's own box instead of covering the viewport.
 *
 * The mounted check uses useSyncExternalStore rather than an effect so the
 * server render returns nothing and hydration stays clean.
 */
export function Portal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;
  return createPortal(children, document.body);
}
