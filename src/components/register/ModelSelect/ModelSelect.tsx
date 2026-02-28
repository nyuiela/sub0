"use client";

import { useRef, useEffect, useState } from "react";
import { MODEL_OPTIONS, type ModelOption } from "@/lib/settings.schema";

export interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  disabled?: boolean;
}

function getOptionLabel(opt: ModelOption): string {
  return opt.comingSoon === true ? `${opt.label} (Coming soon)` : opt.label;
}

export function ModelSelect({
  value,
  onChange,
  "aria-label": ariaLabel,
  disabled = false,
}: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = MODEL_OPTIONS.find((o) => o.value === value);
  const displayLabel = selected ? getOptionLabel(selected) : value;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (opt: ModelOption) => {
    if (opt.comingSoon === true) return;
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-describedby={open ? "model-select-list" : undefined}
        className="register-glass register-model-select-trigger w-full rounded-lg border border-(--reg-border) px-4 py-3 text-left text-(--reg-text) transition-colors focus:border-(--reg-neon-violet) focus:outline-none focus:ring-2 focus:ring-(--reg-neon-violet)/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="block truncate">{displayLabel}</span>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--reg-muted)"
          aria-hidden
        >
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </button>
      {open && (
        <ul
          id="model-select-list"
          role="listbox"
          aria-label={ariaLabel}
          className="register-model-select-list absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-(--reg-border) py-1 shadow-lg"
        >
          {MODEL_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            const isDisabled = opt.comingSoon === true;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                onClick={() => handleSelect(opt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(opt);
                  }
                }}
                className={`register-model-select-option cursor-pointer px-4 py-2.5 text-sm text-(--reg-text) transition-colors ${
                  isDisabled ? "cursor-not-allowed opacity-60" : ""
                } ${isSelected ? "register-model-select-option-selected" : ""}`}
              >
                {getOptionLabel(opt)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
