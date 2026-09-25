"use client";

import { useSyncExternalStore } from "react";
import {
  addToRequestList,
  getRequestListServerSnapshot,
  getRequestListSnapshot,
  subscribeRequestList,
} from "@/lib/request-list";

type AddToRequestButtonProps = {
  slug: string;
  title: string;
  culture: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function AddToRequestButton({
  slug,
  title,
  culture,
  className = "btn btn-gold",
  children = "В заявку",
}: AddToRequestButtonProps) {
  const items = useSyncExternalStore(
    subscribeRequestList,
    getRequestListSnapshot,
    getRequestListServerSnapshot,
  );
  const inList = items.some((item) => item.slug === slug);

  return (
    <button
      type="button"
      className={className}
      onClick={() => addToRequestList({ slug, title, culture })}
    >
      {inList ? "Ещё в заявку" : children}
    </button>
  );
}
