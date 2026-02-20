"use client";

import { ThirdwebProvider as ThirdwebProviderLib } from "thirdweb/react";

export function ThirdwebProvider({ children }: { children: React.ReactNode }) {
  return <ThirdwebProviderLib>{children}</ThirdwebProviderLib>;
}
