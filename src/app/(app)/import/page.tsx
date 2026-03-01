import { getUsers } from "@/lib/dal/users";
import { getCsvProfiles } from "@/lib/dal/csv-profiles";
import { getImportBatches } from "@/lib/dal/import-batches";
import { CsvImportFlow } from "@/components/import/CsvImportFlow";
import { ImportHistory } from "@/components/import/ImportHistory";

export default async function ImportPage() {
  const users = getUsers();
  const profiles = getCsvProfiles();
  const batches = getImportBatches();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Import Expenses</h1>

      <CsvImportFlow
        users={users.map((u) => ({ id: u.id, display_name: u.display_name }))}
        profiles={profiles}
      />

      {batches.length > 0 && <ImportHistory batches={batches} />}
    </div>
  );
}
