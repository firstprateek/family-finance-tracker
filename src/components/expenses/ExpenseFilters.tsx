"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

interface ExpenseFiltersProps {
  users: { id: string; display_name: string }[];
  categories: Category[];
  currentFilters: {
    category?: string;
    paidBy?: string;
    source?: string;
  };
  month: string;
}

export function ExpenseFilters({
  users,
  categories,
  currentFilters,
  month,
}: ExpenseFiltersProps) {
  const router = useRouter();

  function setFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams();
    params.set("month", month);

    const newFilters = { ...currentFilters, [key]: value };
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.paidBy) params.set("paidBy", newFilters.paidBy);
    if (newFilters.source) params.set("source", newFilters.source);

    router.push(`/expenses?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {/* Paid by filter */}
      {users.map((user) => (
        <Badge
          key={user.id}
          variant={currentFilters.paidBy === user.id ? "default" : "outline"}
          className={cn(
            "cursor-pointer whitespace-nowrap",
            currentFilters.paidBy === user.id && "bg-primary"
          )}
          onClick={() =>
            setFilter(
              "paidBy",
              currentFilters.paidBy === user.id ? undefined : user.id
            )
          }
        >
          {user.display_name}
        </Badge>
      ))}
      <div className="w-px bg-border flex-shrink-0" />
      {/* Source filter */}
      {["manual", "recurring", "csv_import"].map((source) => (
        <Badge
          key={source}
          variant={currentFilters.source === source ? "default" : "outline"}
          className={cn(
            "cursor-pointer whitespace-nowrap",
            currentFilters.source === source && "bg-primary"
          )}
          onClick={() =>
            setFilter(
              "source",
              currentFilters.source === source ? undefined : source
            )
          }
        >
          {source === "csv_import"
            ? "CSV"
            : source.charAt(0).toUpperCase() + source.slice(1)}
        </Badge>
      ))}
    </div>
  );
}
