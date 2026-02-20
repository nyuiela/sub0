"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSize } from "@/store/slices/themeSlice";
import { SIZE_IDS } from "@/types/theme.types";
import type { SizeId } from "@/types/theme.types";

const LABELS: Record<SizeId, string> = {
  small: "Small",
  compact: "Compact",
  normal: "Normal",
};

export function SizeSwitcher() {
  const sizeId = useAppSelector((state) => state.theme.sizeId);
  const dispatch = useAppDispatch();

  return (
    <nav aria-label="UI size">
      <ul className="flex gap-2">
        {SIZE_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => dispatch(setSize(id))}
              aria-pressed={sizeId === id}
              className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-[background-color,transform] duration-[var(--duration-normal)] hover:bg-[var(--color-primary-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                boxShadow: sizeId === id ? "0 0 0 2px var(--color-primary)" : undefined,
              }}
            >
              {LABELS[id]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
