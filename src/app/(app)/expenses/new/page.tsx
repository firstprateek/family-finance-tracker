import { getSession } from "@/lib/auth/session";
import { getUsers } from "@/lib/dal/users";
import { getCategories } from "@/lib/dal/categories";
import { getRecentDescriptions } from "@/lib/dal/expenses";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function NewExpensePage() {
  const session = await getSession();
  const users = getUsers();
  const categories = getCategories();
  const recentDescriptions = getRecentDescriptions();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Quick Add</h1>
      <ExpenseForm
        users={users.map((u) => ({ id: u.id, display_name: u.display_name }))}
        categories={categories}
        currentUserId={session!.id}
        recentDescriptions={recentDescriptions}
      />
    </div>
  );
}
