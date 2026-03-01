"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setupAction } from "@/app/actions/auth";

export function SetupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await setupAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Partner 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name1">Name</Label>
              <Input
                id="name1"
                name="name1"
                placeholder="e.g., Alex"
                required
              />
            </div>
            <div>
              <Label htmlFor="income1">Monthly Income</Label>
              <Input
                id="income1"
                name="income1"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="pin1">PIN (optional, 4-6 digits)</Label>
              <Input
                id="pin1"
                name="pin1"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Leave blank for no PIN"
                maxLength={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Partner 2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name2">Name</Label>
              <Input
                id="name2"
                name="name2"
                placeholder="e.g., Jordan"
                required
              />
            </div>
            <div>
              <Label htmlFor="income2">Monthly Income</Label>
              <Input
                id="income2"
                name="income2"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="pin2">PIN (optional, 4-6 digits)</Label>
              <Input
                id="pin2"
                name="pin2"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Leave blank for no PIN"
                maxLength={6}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Setting up..." : "Get Started Together"}
        </Button>
      </div>
    </form>
  );
}
