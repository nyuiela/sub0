"use client";

import { useAppSelector } from "@/store/hooks";
import type { ThemeId } from "@/types/theme.types";
import { Particles } from "./Particles";

const PARTICLE_COLORS_BY_THEME: Record<ThemeId, string[]> = {
  light: ["#000000"],
  dark: ["#ffffff"],
  trading: ["#ffffff"],
};

export interface RegisterPageBackgroundProps {
  children: React.ReactNode;
}

export function RegisterPageBackground({ children }: RegisterPageBackgroundProps) {
  const themeId = useAppSelector((state) => state.theme.themeId);
  const particleColors = PARTICLE_COLORS_BY_THEME[themeId] ?? PARTICLE_COLORS_BY_THEME.trading;

  return (
    <div className="relative min-h-dvh w-full">
      <div
        className="absolute inset-0 z-0"
        style={{ minHeight: "100dvh" }}
      >
        <Particles
          particleColors={particleColors}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>
      <div className="relative z-10 min-h-dvh w-full">
        {children}
      </div>
    </div>
  );
}
