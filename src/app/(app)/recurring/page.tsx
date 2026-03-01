import { getRecurringExpenses } from "@/lib/dal/recurring";
import { getUsers } from "@/lib/dal/users";
import { getCategories } from "@/lib/dal/categories";
import { getSetting } from "@/lib/dal/users";
import { RecurringList } from "@/components/recurring/RecurringList";

export default async function RecurringPage() {
  const recurring = getRecurringExpenses();
  const users = getUsers();
  const categories = getCategories();
  const currencySymbol = getSetting("currency_symbol") || "$";

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.display_name]));
  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.id, { name: c.name, color: c.color }])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recurring Expenses</h1>
      </div>
      <RecurringList
        recurring={recurring}
        userMap={userMap}
        categoryMap={categoryMap}
        currencySymbol={currencySymbol}
        users={users.map((u) => ({ id: u.id, display_name: u.display_name }))}
        categories={categories}
      />
    </div>
  );
}
