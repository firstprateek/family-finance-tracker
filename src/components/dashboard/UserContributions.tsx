import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import type { User } from "@/lib/types";

interface UserContributionsProps {
  users: User[];
  contributions: Record<string, number>;
  shares: Record<string, number>;
  currencySymbol: string;
}

export function UserContributions({
  users,
  contributions,
  shares,
  currencySymbol,
}: UserContributionsProps) {
  // Find who paid the most extra
  let maxOverpayerId: string | null = null;
  let maxOverpayment = 0;
  for (const user of users) {
    const diff = (contributions[user.id] || 0) - (shares[user.id] || 0);
    if (diff > maxOverpayment + 0.01) {
      maxOverpayment = diff;
      maxOverpayerId = user.id;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {users.map((user) => {
        const paid = contributions[user.id] || 0;
        const share = shares[user.id] || 0;
        const diff = paid - share;
        const isOverpayer = user.id === maxOverpayerId;

        return (
          <Card key={user.id}>
            <CardContent className="p-4 space-y-1">
              <p className="text-sm text-muted-foreground truncate">
                {user.display_name}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(paid, currencySymbol)}
              </p>
              <p className="text-xs text-muted-foreground">
                Share: {formatCurrency(share, currencySymbol)}
              </p>
              {isOverpayer && diff > 0.01 && (
                <p className="text-xs font-medium text-green-600">
                  {formatCurrency(diff, currencySymbol)} extra
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
