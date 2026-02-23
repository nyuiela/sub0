"use client";

export function TemplatesSection() {
  return (
    <section
      className="flex flex-1 flex-col gap-6 overflow-auto px-4 py-6"
      aria-label="Agent templates settings content"
    >
      <article className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-foreground">Templates and skills</h3>
        <p className="mt-2 text-sm text-muted">
          Agent templates define reusable personas and strategies. When you
          register, you can create an agent from scratch or from a template by
          entering its ID on the registration flow. A public listing of
          templates will be available here once the API is enabled.
        </p>
      </article>
    </section>
  );
}
