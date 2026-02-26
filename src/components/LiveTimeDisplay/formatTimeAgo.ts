/**
 * Formats an ISO date as a live "time ago" string with second granularity.
 * Used by LiveTimeDisplay for DOM updates without React re-renders.
 */
export function formatTimeAgo(iso: string, now: Date = new Date()): string {
  try {
    const d = new Date(iso);
    const diffMs = now.getTime() - d.getTime();
    const totalSec = Math.floor(diffMs / 1000);
    if (totalSec < 0) return "0s";

    const diffDay = Math.floor(totalSec / 86400);
    const diffHour = Math.floor((totalSec % 86400) / 3600);
    const diffMin = Math.floor((totalSec % 3600) / 60);
    const sec = totalSec % 60;

    if (diffDay >= 7) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    if (diffDay > 0) {
      return `${diffDay}d ${diffHour}h ${diffMin}m ${sec}s`;
    }
    if (diffHour > 0) {
      return `${diffHour}h ${diffMin}m ${sec}s`;
    }
    if (diffMin > 0) {
      return `${diffMin}m ${sec}s`;
    }
    return `${sec}s`;
  } catch {
    return "";
  }
}
