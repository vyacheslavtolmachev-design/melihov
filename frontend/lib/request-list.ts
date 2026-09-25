export type RequestListItem = {
  slug: string;
  title: string;
  culture: string | null;
  quantity: number;
};

const STORAGE_KEY = "melihov-request-list";

type Listener = () => void;

let memoryItems: RequestListItem[] = [];
let hydrated = false;
const listeners = new Set<Listener>();

function canUseStorage() {
  return typeof window !== "undefined";
}

function readStorage(): RequestListItem[] {
  if (!canUseStorage()) return memoryItems;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RequestListItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.slug === "string" &&
        typeof item.title === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeStorage(items: RequestListItem[]) {
  memoryItems = items;
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function emit() {
  listeners.forEach((listener) => listener());
}

function ensureHydrated() {
  if (hydrated || !canUseStorage()) return;
  memoryItems = readStorage();
  hydrated = true;
}

export function getRequestListSnapshot(): RequestListItem[] {
  ensureHydrated();
  return memoryItems;
}

export function getRequestListServerSnapshot(): RequestListItem[] {
  return [];
}

export function subscribeRequestList(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addToRequestList(item: Omit<RequestListItem, "quantity"> & { quantity?: number }) {
  ensureHydrated();
  const quantity = item.quantity ?? 1;
  const existing = memoryItems.find((entry) => entry.slug === item.slug);

  const next = existing
    ? memoryItems.map((entry) =>
        entry.slug === item.slug ? { ...entry, quantity: entry.quantity + quantity } : entry,
      )
    : [...memoryItems, { slug: item.slug, title: item.title, culture: item.culture, quantity }];

  writeStorage(next);
  emit();
}

export function setRequestListQuantity(slug: string, quantity: number) {
  ensureHydrated();
  const next =
    quantity <= 0
      ? memoryItems.filter((entry) => entry.slug !== slug)
      : memoryItems.map((entry) => (entry.slug === slug ? { ...entry, quantity } : entry));
  writeStorage(next);
  emit();
}

export function removeFromRequestList(slug: string) {
  ensureHydrated();
  writeStorage(memoryItems.filter((entry) => entry.slug !== slug));
  emit();
}

export function clearRequestList() {
  ensureHydrated();
  writeStorage([]);
  emit();
}

export function requestListCount(items: RequestListItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
