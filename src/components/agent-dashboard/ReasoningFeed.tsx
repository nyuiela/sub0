"use client";

import { useState } from "react";
import type { AgentReasoning } from "@/types/agent.types";

export interface ReasoningFeedProps {
  items: AgentReasoning[];
  loading?: boolean;
  className?: string;
}

function parseNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function getSentiment(response: string, actionTaken: string): "Bullish" | "Bearish" | "Neutral" {
  const r = (response ?? "").toUpperCase();
  const a = (actionTaken ?? "").toUpperCase();
  if (/BUY|LONG|YES/.test(r) || /LONG|BUY/.test(a)) return "Bullish";
  if (/SELL|SHORT|NO/.test(r) || /SHORT|SELL/.test(a)) return "Bearish";
  return "Neutral";
}

const KEYWORDS: { pattern: RegExp; className: string }[] = [
  { pattern: /\bBUY\b/gi, className: "text-success" },
  { pattern: /\bSELL\b/gi, className: "text-danger" },
  { pattern: /\bLONG\b/gi, className: "text-success" },
  { pattern: /\bSHORT\b/gi, className: "text-danger" },
  { pattern: /\bRISK_THRESHOLD_EXCEEDED\b/gi, className: "text-warning" },
  { pattern: /\bHOLD\b/gi, className: "text-muted" },
];

interface Match {
  start: number;
  end: number;
  className: string;
}

function HighlightKeywords({ text }: { text: string }) {
  if (!text) return null;
  const matches: Match[] = [];
  KEYWORDS.forEach(({ pattern, className }) => {
    const re = new RegExp(pattern.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        className,
      });
    }
  });
  matches.sort((a, b) => a.start - b.start);
  const merged: Match[] = [];
  for (const m of matches) {
    if (merged.length > 0 && m.start < merged[merged.length - 1].end) continue;
    merged.push(m);
  }
  if (merged.length === 0) return <>{text}</>;
  const segments: React.ReactNode[] = [];
  let last = 0;
  merged.forEach(({ start, end, className }, i) => {
    if (start > last) segments.push(text.slice(last, start));
    segments.push(
      <span key={`${i}-${start}`} className={className}>
        {text.slice(start, end)}
      </span>
    );
    last = end;
  });
  if (last < text.length) segments.push(text.slice(last));
  return <>{segments}</>;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ReasoningEntry({ item }: { item: AgentReasoning }) {
  const [open, setOpen] = useState(false);
  const sentiment = getSentiment(item.response, item.actionTaken);
  const cost = parseNum(item.estimatedCost);

  const sentimentClass =
    sentiment === "Bullish"
      ? "bg-success/20 text-success"
      : sentiment === "Bearish"
        ? "bg-danger/20 text-danger"
        : "bg-muted/50 text-muted";

  return (
    <article
      className="border-b border-border bg-surface last:border-b-0"
      aria-label={`Reasoning at ${formatTime(item.createdAt)}`}
    >
      <header className="flex flex-wrap items-center gap-2 p-3">
        <time
          className="text-xs text-muted"
          dateTime={item.createdAt}
        >
          {formatTime(item.createdAt)}
        </time>
        <span className="text-xs text-muted">
          Market {item.marketId.slice(0, 8)}…
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${sentimentClass}`}
        >
          {sentiment}
        </span>
        <span className="ml-auto text-[10px] text-muted">
          {item.totalTokens} tok · ${cost.toFixed(4)}
        </span>
      </header>
      <section className="px-3 pb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-left text-xs font-medium text-primary hover:underline"
          aria-expanded={open}
        >
          {open ? "Hide reasoning" : "Show reasoning"}
        </button>
        {open && (
          <pre
            className="mt-2 overflow-x-auto rounded border border-border bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            <code>
              <HighlightKeywords
                text={
                  [item.reasoning || "(No reasoning text)"]
                    .concat(item.response ? `→ ${item.response}` : [])
                    .concat(item.actionTaken ? ` | ${item.actionTaken}` : [])
                    .join("\n")
                }
              />
            </code>
          </pre>
        )}
      </section>
    </article>
  );
}

export function ReasoningFeed({
  items,
  loading = false,
  className = "",
}: ReasoningFeedProps) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface ${className}`.trim()}
      aria-label="Chain-of-thought reasoning feed"
    >
      <h3 className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Reasoning & Logs
      </h3>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center p-6 text-sm text-muted">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-muted">No reasoning logs yet.</p>
        ) : (
          <ul className="list-none">
            {items.map((item) => (
              <li key={item.id}>
                <ReasoningEntry item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
