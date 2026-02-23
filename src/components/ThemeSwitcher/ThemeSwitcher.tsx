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

const THEME_SELECT_CLASS =
  "cursor-pointer rounded-md border border-border bg-surface px-3 py-2 pr-8 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary";

export function ThemeSwitcher() {
  const themeId = useAppSelector((state) => state.theme.themeId);
  const dispatch = useAppDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ThemeId;
    if (THEME_IDS.includes(value)) dispatch(setTheme(value));
  };

  return (
    <nav aria-label="Theme selection" className="relative inline-flex items-center gap-2">
      <span className="text-muted" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </span>
      <select
        value={themeId}
        onChange={handleChange}
        aria-label="Select color theme"
        className={THEME_SELECT_CLASS}
      >
        {THEME_IDS.map((id) => (
          <option key={id} value={id}>
            {LABELS[id]}
          </option>
        ))}
      </select>
    </nav>
  );
}
