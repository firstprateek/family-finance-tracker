import { getUsers, getSetting } from "@/lib/dal/users";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const users = getUsers();
  const currency = getSetting("currency") || "USD";
  const currencySymbol = getSetting("currency_symbol") || "$";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsForm
        users={users.map((u) => ({
          id: u.id,
          display_name: u.display_name,
          income: u.income,
        }))}
        currency={currency}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
