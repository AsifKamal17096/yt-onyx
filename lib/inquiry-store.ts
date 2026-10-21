"use client";

import { useSyncExternalStore } from "react";

/**
 * The inquiry list — a cart without a checkout.
 *
 * It lives in localStorage and is read through useSyncExternalStore rather
 * than component state, so every mount of the badge, the drawer and the
 * add-buttons sees the same list and updates together (including across
 * browser tabs, via the `storage` event).
 */

export type InquiryItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  priceCents: number;
  /** Public URL of the thumbnail, resolved on the server when added. */
  thumbUrl: string | null;
  quantity: number;
};

const STORAGE_KEY = "ytonyx.inquiry.v1";
const MAX_ITEMS = 40;
const MAX_QUANTITY = 999;

const EMPTY: InquiryItem[] = [];

let cache: InquiryItem[] | null = null;
const listeners = new Set<() => void>();

function isItem(value: unknown): value is InquiryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.sku === "string" &&
    typeof item.priceCents === "number" &&
    typeof item.quantity === "number"
  );
}

/** Reads and sanitises the stored list; anything malformed is discarded. */
function load(): InquiryItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const items = parsed.filter(isItem).map((item) => ({
      ...item,
      thumbUrl: typeof item.thumbUrl === "string" ? item.thumbUrl : null,
      quantity: clampQuantity(item.quantity),
    }));

    return items.length > 0 ? items.slice(0, MAX_ITEMS) : EMPTY;
  } catch {
    // Private mode, disabled storage or corrupted JSON — start empty.
    return EMPTY;
  }
}

function persist(items: InquiryItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage may be full or blocked; the in-memory list still works.
  }
  for (const listener of listeners) listener();
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.round(value)));
}

function getSnapshot(): InquiryItem[] {
  if (cache === null) cache = load();
  return cache;
}

function getServerSnapshot(): InquiryItem[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cache = null; // another tab changed the list
    for (const callback of listeners) callback();
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function addItem(item: Omit<InquiryItem, "quantity">, quantity = 1) {
  const items = getSnapshot();
  const existing = items.find((entry) => entry.productId === item.productId);

  if (existing) {
    persist(
      items.map((entry) =>
        entry.productId === item.productId
          ? { ...entry, quantity: clampQuantity(entry.quantity + quantity) }
          : entry,
      ),
    );
    return;
  }

  if (items.length >= MAX_ITEMS) return;
  persist([...items, { ...item, quantity: clampQuantity(quantity) }]);
}

export function removeItem(productId: string) {
  persist(getSnapshot().filter((entry) => entry.productId !== productId));
}

export function setQuantity(productId: string, quantity: number) {
  persist(
    getSnapshot().map((entry) =>
      entry.productId === productId
        ? { ...entry, quantity: clampQuantity(quantity) }
        : entry,
    ),
  );
}

export function clearList() {
  persist([]);
}

/**
 * Replaces stored snapshots with fresh server data and drops anything that is
 * no longer published. Quantities, which belong to the visitor, are kept.
 */
export function reconcile(fresh: Omit<InquiryItem, "quantity">[]) {
  const byId = new Map(fresh.map((item) => [item.productId, item]));
  const current = getSnapshot();
  const next = current
    .filter((item) => byId.has(item.productId))
    .map((item) => ({ ...byId.get(item.productId)!, quantity: item.quantity }));

  // Avoid a pointless re-render when nothing actually changed.
  if (JSON.stringify(next) === JSON.stringify(current)) return;
  persist(next);
}

/** Fetches current details for everything on the list and reconciles it. */
export async function refreshList(): Promise<void> {
  const items = getSnapshot();
  if (items.length === 0) return;

  try {
    const ids = items.map((item) => item.productId).join(",");
    const response = await fetch(
      `/api/inquiry/items?ids=${encodeURIComponent(ids)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return;

    const data: unknown = await response.json();
    const fresh = (data as { items?: unknown }).items;
    if (!Array.isArray(fresh)) return;

    reconcile(
      fresh.filter(
        (item): item is Omit<InquiryItem, "quantity"> =>
          isItem({ ...(item as object), quantity: 1 }),
      ),
    );
  } catch {
    // Offline or server error: keep showing the stored snapshot.
  }
}

/** Subscribes a component to the list. */
export function useInquiryList(): InquiryItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useInquiryCount(): number {
  const items = useInquiryList();
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function useIsInList(productId: string): boolean {
  const items = useInquiryList();
  return items.some((item) => item.productId === productId);
}

export function subtotalCents(items: InquiryItem[]): number {
  return items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
}
