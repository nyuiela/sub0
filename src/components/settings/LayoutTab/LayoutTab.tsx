"use client";

import { useAppDispatch } from "@/store/hooks";
import { resetColumnOrder } from "@/store/slices/layoutSlice";
import { toast } from "sonner";

export function LayoutTab() {
  const dispatch = useAppDispatch();

  function handleResetLayout() {
    dispatch(resetColumnOrder());
    toast.success("Layout reset to default. Column order and sizes have been restored.");
  }

  return (
    <section className="space-y-4" aria-label="Layout settings">
      <p className="text-sm text-muted-foreground">
        Dashboard column order and widths are saved locally. Use the button below to restore the default layout.
      </p>
      <div>
        <button
          type="button"
          onClick={handleResetLayout}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Reset layout to default"
        >
          Reset layout to default
        </button>
      </div>
    </section>
  );
}
