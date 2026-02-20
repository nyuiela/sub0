"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/slices/themeSlice";
import { THEME_IDS } from "@/types/theme.types";
import type { ThemeId } from "@/types/theme.types";

const LABELS: Record<ThemeId, string> = {
  light: "Light",
  dark: "Dark",
  trading: "Trading",
};

export function ThemeSwitcher() {
  const themeId = useAppSelector((state) => state.theme.themeId);
  const dispatch = useAppDispatch();

  return (
    <nav aria-label="Theme selection">
      <ul className="flex gap-2">
        {THEME_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => dispatch(setTheme(id))}
              aria-pressed={themeId === id}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-[background-color,transform] duration-[var(--duration-normal)] hover:bg-[var(--color-primary-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              style={{
                boxShadow: themeId === id ? "0 0 0 2px var(--color-primary)" : undefined,
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
