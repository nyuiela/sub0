"use client";

import { useEffect, useState } from "react";

export function SkillContent({ content }: { content: string }) {
  const [Markdown, setMarkdown] = useState<React.ComponentType<{ source: string }> | null>(null);

  useEffect(() => {
    import("@uiw/react-md-editor").then((mod) => {
      const M = (mod.default as { Markdown?: React.ComponentType<{ source: string }> }).Markdown;
      if (M) setMarkdown(() => M);
    });
  }, []);

  if (Markdown) {
    return (
      <article className="prose prose-invert max-w-none rounded-lg border border-border bg-surface p-6">
        <Markdown source={content} />
      </article>
    );
  }

  return (
    <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface p-6 font-sans text-sm text-foreground">
      {content}
    </pre>
  );
}
