/**
 * DiceBear avatars via @dicebear/core and @dicebear/collection.
 * Returns a data URI so avatars render without external requests and size correctly.
 */

import { createAvatar } from "@dicebear/core";
import { botttsNeutral, shapes, personas } from "@dicebear/collection";

export type AvatarStyle = "agent" | "market" | "persona";

function createDiceBearAvatar(seed: string, style: AvatarStyle) {
  const safeSeed = (seed?.trim() || "default").slice(0, 100);
  switch (style) {
    case "agent":
      return createAvatar(botttsNeutral, { seed: safeSeed });
    case "market":
      return createAvatar(shapes, { seed: safeSeed });
    case "persona":
      return createAvatar(personas, { seed: safeSeed });
  }
}

/**
 * Returns a deterministic DiceBear avatar as SVG string.
 */
export function getDiceBearSvg(
  seed: string,
  style: AvatarStyle = "agent"
): string {
  return createDiceBearAvatar(seed, style).toString();
}

/**
 * Returns a data URI for use as img src. Use with a plain img and explicit width/height so the avatar displays and sizes correctly.
 */
export function getDiceBearAvatarUrl(
  seed: string,
  style: AvatarStyle = "agent"
): string {
  return createDiceBearAvatar(seed, style).toDataUri();
}
