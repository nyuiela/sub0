"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateThemeFromStorage } from "@/store/themePersist";
import { hydrateLayoutFromStorage } from "@/store/layoutPersist";
import type { ThemeId, FontId, SizeId } from "@/types/theme.types";

function applyTheme(themeId: ThemeId, fontId: FontId, sizeId: SizeId): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);
  root.setAttribute("data-font", fontId);
  root.setAttribute("data-size", sizeId);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const themeId = useAppSelector((state) => state.theme.themeId);
  const fontId = useAppSelector((state) => state.theme.fontId);
  const sizeId = useAppSelector((state) => state.theme.sizeId);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      hydrateThemeFromStorage(dispatch);
      hydrateLayoutFromStorage(dispatch);
    }
  }, [dispatch]);

  useEffect(() => {
    applyTheme(themeId, fontId, sizeId);
  }, [themeId, fontId, sizeId]);

  return <>{children}</>;
}
