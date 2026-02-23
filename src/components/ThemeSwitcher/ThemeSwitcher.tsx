"use client";

import { useRef, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme } from "@/store/slices/themeSlice";
import { THEME_IDS } from "@/types/theme.types";
import type { ThemeId } from "@/types/theme.types";

const LABELS: Record<ThemeId, string> = {
  light: "Light",
  dark: "Dark",
  trading: "Trading",
};

const BUTTON_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary";

export function ThemeSwitcher() {
  const themeId = useAppSelector((state) => state.theme.themeId);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current != null && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (id: ThemeId) => {
    dispatch(setTheme(id));
    setOpen(false);
  };

  return (
    <nav
      ref={containerRef}
      aria-label="Theme selection"
      className="relative inline-flex"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select color theme"
        className={BUTTON_CLASS}
      >
        <img
          src="/icons/sun.svg"
          width={16}
          height={16}
          alt=""
          aria-hidden
          className={`shrink-0 ${themeId === "dark" || themeId === "trading" ? "invert" : ""}`}
        />
        <span>{LABELS[themeId]}</span>
        <img
          src="/icons/chevron-down.svg"
          width={16}
          height={16}
          alt=""
          aria-hidden
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 top-full z-(--z-dropdown) mt-1 min-w-32 rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {THEME_IDS.map((id) => (
            <li key={id} role="option" aria-selected={themeId === id}>
              <button
                type="button"
                onClick={() => handleSelect(id)}
                className={`w-full cursor-pointer px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                  themeId === id
                    ? "bg-primary-muted text-primary"
                    : "bg-surface text-foreground hover:bg-muted/50"
                }`}
              >
                {LABELS[id]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
