"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

interface CategoryPickerProps {
  categories: Category[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors border",
            selectedId === cat.id
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: cat.color || "#6366f1" }}
          />
          {cat.name}
        </button>
      ))}
    </div>
  );
}
