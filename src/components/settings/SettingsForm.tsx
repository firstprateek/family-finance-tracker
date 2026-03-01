"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettingsAction } from "@/app/actions/settings";
import { logoutAction } from "@/app/actions/auth";
import { toast } from "sonner";

interface SettingsFormProps {
  users: { id: string; display_name: string; income: number }[];
  currency: string;
  currencySymbol: string;
  monthlyTarget: number;
}

export function SettingsForm({
  users: initialUsers,
  monthlyTarget: initialTarget,
}: SettingsFormProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [monthlyTarget, setMonthlyTarget] = useState(initialTarget);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateSettingsAction({ users, monthlyTarget });
    setSaving(false);

    if (result.success) {
      toast.success("Settings saved");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save");
    }
  }

  function updateUserField(
    index: number,
    field: "display_name" | "income",
    value: string | number
  ) {
    setUsers((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user, index) => (
        <Card key={user.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{user.display_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={user.display_name}
                onChange={(e) =>
                  updateUserField(index, "display_name", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Monthly Income</Label>
              <Input
                type="number"
                step="0.01"
                value={user.income}
                onChange={(e) =>
                  updateUserField(
                    index,
                    "income",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Monthly Target</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Target Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 5000"
              value={monthlyTarget || ""}
              onChange={(e) =>
                setMonthlyTarget(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Set a monthly spending target to track on your dashboard
          </p>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>

      <div className="pt-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => logoutAction()}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
