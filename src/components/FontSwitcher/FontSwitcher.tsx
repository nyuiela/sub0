"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFont } from "@/store/slices/themeSlice";
import { FONT_IDS } from "@/types/theme.types";
import type { FontId } from "@/types/theme.types";

const LABELS: Record<FontId, string> = {
  inter: "Inter",
  geist: "Geist",
  "jetbrains-mono": "Mono",
};

export function FontSwitcher() {
  const fontId = useAppSelector((state) => state.theme.fontId);
  const dispatch = useAppDispatch();

  return (
    <nav aria-label="Font selection">
      <ul className="flex gap-2">
        {FONT_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => dispatch(setFont(id))}
              aria-pressed={fontId === id}
              className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-[background-color,transform] duration-[var(--duration-normal)] hover:bg-[var(--color-primary-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                boxShadow: fontId === id ? "0 0 0 2px var(--color-primary)" : undefined,
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
