"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createExpenseAction } from "@/app/actions/expenses";
import { CategoryPicker } from "./CategoryPicker";
import { VoiceInput } from "./VoiceInput";
import { getToday } from "@/lib/utils/dates";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import type { Category } from "@/lib/types";

interface ExpenseFormProps {
  users: { id: string; display_name: string }[];
  categories: Category[];
  currentUserId: string;
  recentDescriptions: string[];
  editMode?: boolean;
  initialData?: {
    amount: string;
    description: string;
    category_id: number;
    paid_by: string;
    date: string;
    notes: string;
  };
  onSubmit?: (data: {
    amount: number;
    description: string;
    category_id: number;
    paid_by: string;
    date: string;
    notes: string;
  }) => Promise<void>;
}

export function ExpenseForm({
  users,
  categories,
  currentUserId,
  recentDescriptions,
  editMode = false,
  initialData,
  onSubmit,
}: ExpenseFormProps) {
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState<number>(
    initialData?.category_id || categories[0]?.id || 0
  );
  const [paidBy, setPaidBy] = useState(initialData?.paid_by || currentUserId);
  const [date, setDate] = useState(initialData?.date || getToday());
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [showNotes, setShowNotes] = useState(!!initialData?.notes);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = recentDescriptions.filter(
    (d) =>
      description.length > 0 &&
      d.toLowerCase().includes(description.toLowerCase()) &&
      d.toLowerCase() !== description.toLowerCase()
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setLoading(true);

    if (onSubmit) {
      await onSubmit({
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId,
        paid_by: paidBy,
        date,
        notes: notes.trim(),
      });
      setLoading(false);
      return;
    }

    const result = await createExpenseAction({
      date,
      description: description.trim(),
      category_id: categoryId,
      amount: parsedAmount,
      paid_by: paidBy,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success("Added!");
      // Reset form but keep category and paid_by for fast re-entry
      setAmount("");
      setDescription("");
      setNotes("");
      setShowNotes(false);
      setDate(getToday());
      amountRef.current?.focus();
    } else {
      toast.error(result.error || "Failed to add expense");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 p-4">
          {/* Amount - big and prominent */}
          <div>
            <Label htmlFor="amount" className="text-xs text-muted-foreground">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                $
              </span>
              <Input
                ref={amountRef}
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-3xl font-bold h-14 border-0 border-b rounded-none focus-visible:ring-0"
                autoFocus
                required
              />
            </div>
          </div>

          {/* AI shortcuts: voice + receipt */}
          <div className="flex gap-2">
            <VoiceInput
              onResult={(data) => {
                if (data.amount) setAmount(String(data.amount));
                if (data.description) setDescription(data.description);
                if (data.suggestedCategory) {
                  const cat = categories.find(
                    (c) =>
                      c.name.toLowerCase() ===
                      data.suggestedCategory!.toLowerCase()
                  );
                  if (cat) setCategoryId(cat.id);
                }
                if (data.transcription) {
                  toast.info(`Heard: "${data.transcription}"`);
                }
              }}
            />
            <label className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 gap-2"
                asChild
              >
                <span>
                  <Camera className="h-4 w-4" />
                  Scan Receipt
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("image", file);
                  try {
                    const res = await fetch("/api/ai/receipt", {
                      method: "POST",
                      body: formData,
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.amount) setAmount(String(data.amount));
                      if (data.description) setDescription(data.description);
                      if (data.date) setDate(data.date);
                      if (data.suggestedCategory) {
                        const cat = categories.find(
                          (c) =>
                            c.name.toLowerCase() ===
                            data.suggestedCategory.toLowerCase()
                        );
                        if (cat) setCategoryId(cat.id);
                      }
                      toast.success("Receipt scanned!");
                    }
                  } catch {
                    toast.error("Receipt scan failed");
                  }
                }}
              />
            </label>
          </div>

          {/* Description with autocomplete */}
          <div className="relative">
            <Label
              htmlFor="description"
              className="text-xs text-muted-foreground"
            >
              What was it for?
            </Label>
            <Input
              id="description"
              placeholder="e.g., Groceries at Trader Joe's"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                {filteredSuggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onMouseDown={() => {
                      setDescription(s);
                      setShowSuggestions(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs text-muted-foreground">Category</Label>
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          </div>

          {/* Paid By */}
          <div>
            <Label className="text-xs text-muted-foreground">Paid by</Label>
            <div className="flex gap-2 mt-1">
              {users.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant={paidBy === user.id ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPaidBy(user.id)}
                >
                  {user.display_name}
                </Button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Notes (collapsible) */}
          {!showNotes ? (
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-muted-foreground"
              onClick={() => setShowNotes(true)}
            >
              + Add notes
            </Button>
          ) : (
            <div>
              <Label htmlFor="notes" className="text-xs text-muted-foreground">
                Notes
              </Label>
              <Input
                id="notes"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={loading}
          >
            {loading
              ? "Adding..."
              : editMode
                ? "Save Changes"
                : "Add Expense"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
