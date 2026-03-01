"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { loginAction } from "@/app/actions/auth";

interface LoginFormProps {
  users: { id: string; display_name: string; has_pin: boolean }[];
}

export function LoginForm({ users }: LoginFormProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = users.find((u) => u.id === selectedUser);

  async function handleLogin() {
    if (!selectedUser) return;
    setLoading(true);
    setError("");

    const result = await loginAction(selectedUser, pin);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  if (!selectedUser) {
    return (
      <div className="space-y-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => {
              setSelectedUser(user.id);
              if (!user.has_pin) {
                // Auto-login if no PIN set
                setLoading(true);
                loginAction(user.id, "").then((result) => {
                  if (result?.error) {
                    setError(result.error);
                    setLoading(false);
                  }
                });
              }
            }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {user.has_pin ? "PIN required" : "Tap to continue"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!selected?.has_pin) {
    return (
      <div className="text-center text-muted-foreground">Signing in...</div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold">
            {selected.display_name.charAt(0).toUpperCase()}
          </div>
          <p className="font-medium">{selected.display_name}</p>
        </div>
        <div>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="text-center text-2xl tracking-[0.5em]"
            maxLength={6}
            autoFocus
          />
        </div>
        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={loading || pin.length < 4}
        >
          {loading ? "Signing in..." : "Continue"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setSelectedUser(null);
            setPin("");
            setError("");
          }}
        >
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
