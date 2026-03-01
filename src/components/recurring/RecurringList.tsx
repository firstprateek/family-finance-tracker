"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pause, Play } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { getToday, getCurrentMonth } from "@/lib/utils/dates";
import { CategoryPicker } from "@/components/expenses/CategoryPicker";
import {
  createRecurringAction,
  deleteRecurringAction,
  updateRecurringAction,
  generateRecurringAction,
} from "@/app/actions/recurring";
import { toast } from "sonner";
import type { RecurringExpense, Category } from "@/lib/types";

interface RecurringListProps {
  recurring: RecurringExpense[];
  userMap: Record<string, string>;
  categoryMap: Record<number, { name: string; color: string | null }>;
  currencySymbol: string;
  users: { id: string; display_name: string }[];
  categories: Category[];
}

export function RecurringList({
  recurring,
  userMap,
  categoryMap,
  currencySymbol,
  users,
  categories,
}: RecurringListProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Add form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 0);
  const [paidBy, setPaidBy] = useState(users[0]?.id || "");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  async function handleAdd() {
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || !parsedAmount) {
      toast.error("Description and amount are required");
      return;
    }

    const result = await createRecurringAction({
      description: description.trim(),
      category_id: categoryId,
      amount: parsedAmount,
      paid_by: paidBy,
      day_of_month: parseInt(dayOfMonth) || 1,
      start_date: getToday(),
    });

    if (result.success) {
      toast.success("Added recurring expense");
      setShowAdd(false);
      setDescription("");
      setAmount("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add");
    }
  }

  async function handleToggle(id: number, currentlyActive: number) {
    await updateRecurringAction(id, {
      is_active: currentlyActive ? 0 : 1,
    });
    router.refresh();
  }

  async function handleDelete(id: number) {
    await deleteRecurringAction(id);
    toast.success("Removed");
    router.refresh();
  }

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateRecurringAction(getCurrentMonth());
    setGenerating(false);

    if (result.success) {
      if (result.generated > 0) {
        toast.success(
          `Generated ${result.generated} expense${result.generated !== 1 ? "s" : ""} for this month`
        );
      } else {
        toast.info("All recurring expenses already generated for this month");
      }
    }
  }

  const totalMonthly = recurring
    .filter((r) => r.is_active && r.frequency === "monthly")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-4">
      {recurring.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {formatCurrency(totalMonthly, currencySymbol)}/month in recurring
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate This Month"}
          </Button>
        </div>
      )}

      {recurring.map((item) => {
        const cat = categoryMap[item.category_id];
        return (
          <Card
            key={item.id}
            className={item.is_active ? "" : "opacity-50"}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: cat?.color || "#6366f1",
                }}
              >
                {(cat?.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {userMap[item.paid_by] || item.paid_by}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Day {item.day_of_month || 1}
                  </Badge>
                </div>
              </div>
              <p className="font-semibold text-sm flex-shrink-0">
                {formatCurrency(item.amount, currencySymbol)}
              </p>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggle(item.id, item.is_active)}
                >
                  {item.is_active ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" /> Add Recurring Expense
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Recurring Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Input
                placeholder="e.g., Netflix, Rent"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Category</Label>
              <CategoryPicker
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
              />
            </div>
            <div>
              <Label>Paid by</Label>
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
            <div>
              <Label>Day of month</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
