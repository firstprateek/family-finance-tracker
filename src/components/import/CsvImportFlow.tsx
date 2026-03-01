"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { detectColumnsAction, importCsvAction, reconcileBatchAction } from "@/app/actions/import";
import { toast } from "sonner";
import type { CsvProfile } from "@/lib/types";

type Step = "upload" | "configure" | "preview" | "done";

interface CsvImportFlowProps {
  users: { id: string; display_name: string }[];
  profiles: CsvProfile[];
}

export function CsvImportFlow({ users, profiles }: CsvImportFlowProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  // Detection results
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);

  // Config
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("");
  const [dateColumn, setDateColumn] = useState("");
  const [descriptionColumn, setDescriptionColumn] = useState("");
  const [amountColumn, setAmountColumn] = useState("");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [amountSign, setAmountSign] = useState<"positive" | "negative">("positive");
  const [paidBy, setPaidBy] = useState(users[0]?.id || "");

  // Result
  const [importResult, setImportResult] = useState<{
    batchId: number;
    rowCount: number;
    autoMatched?: number;
    suggested?: number;
    unmatchedCsv?: number;
  } | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const content = await file.text();
    setCsvContent(content);

    setLoading(true);
    const detection = await detectColumnsAction(content);
    setHeaders(detection.headers);
    setSampleRows(detection.sampleRows);

    if (detection.suggestedProfile) {
      setDateColumn(detection.suggestedProfile.date_column || "");
      setDescriptionColumn(detection.suggestedProfile.description_column || "");
      setAmountColumn(detection.suggestedProfile.amount_column || "");
    }

    setLoading(false);
    setStep("configure");
  }

  async function handleImport() {
    setLoading(true);

    const result = await importCsvAction({
      csvContent,
      profileId: profileId || undefined,
      profileData:
        !profileId
          ? {
              name: profileName || fileName,
              date_column: dateColumn,
              description_column: descriptionColumn,
              amount_column: amountColumn,
              date_format: dateFormat,
              amount_sign: amountSign,
            }
          : undefined,
      paidBy,
    });

    if (!result.success) {
      toast.error(result.error || "Import failed");
      setLoading(false);
      return;
    }

    // Run reconciliation
    const reconResult = await reconcileBatchAction(result.batchId!);

    setImportResult({
      batchId: result.batchId!,
      rowCount: result.rowCount!,
      autoMatched: reconResult.autoMatched,
      suggested: reconResult.suggested,
      unmatchedCsv: reconResult.unmatchedCsv,
    });

    setLoading(false);
    setStep("done");
    toast.success(`Imported ${result.rowCount} expenses`);
  }

  function reset() {
    setStep("upload");
    setCsvContent("");
    setFileName("");
    setHeaders([]);
    setSampleRows([]);
    setProfileId(null);
    setProfileName("");
    setDateColumn("");
    setDescriptionColumn("");
    setAmountColumn("");
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  if (step === "upload") {
    return (
      <Card>
        <CardContent className="p-6">
          <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Upload CSV file</p>
            <p className="text-sm text-muted-foreground mt-1">
              From your credit card or bank statement
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </CardContent>
      </Card>
    );
  }

  if (step === "configure") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {fileName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.length > 0 && (
            <div>
              <Label>Use existing profile</Label>
              <Select
                value={profileId?.toString() || "new"}
                onValueChange={(v) => {
                  if (v === "new") {
                    setProfileId(null);
                  } else {
                    const p = profiles.find((pr) => pr.id === parseInt(v));
                    if (p) {
                      setProfileId(p.id);
                      setDateColumn(p.date_column);
                      setDescriptionColumn(p.description_column);
                      setAmountColumn(p.amount_column);
                      setDateFormat(p.date_format);
                      setAmountSign(p.amount_sign as "positive" | "negative");
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New profile</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!profileId && (
            <>
              <div>
                <Label>Profile name</Label>
                <Input
                  placeholder="e.g., Chase Visa"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Date column</Label>
                  <Select value={dateColumn} onValueChange={setDateColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description column</Label>
                  <Select
                    value={descriptionColumn}
                    onValueChange={setDescriptionColumn}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Amount column</Label>
                  <Select value={amountColumn} onValueChange={setAmountColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                      <SelectItem value="M/D/YYYY">M/D/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Amount sign convention</Label>
                  <Select
                    value={amountSign}
                    onValueChange={(v) =>
                      setAmountSign(v as "positive" | "negative")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">
                        Positive = charge (most cards)
                      </SelectItem>
                      <SelectItem value="negative">
                        Negative = charge (some banks)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div>
            <Label>Paid by (for all imported transactions)</Label>
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

          {/* Sample preview */}
          {sampleRows.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Preview (first 3 rows)</Label>
              <div className="mt-1 overflow-x-auto rounded border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {headers.slice(0, 5).map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {headers.slice(0, 5).map((h) => (
                          <td key={h} className="px-2 py-1.5 truncate max-w-[120px]">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleImport}
              disabled={
                loading || !dateColumn || !descriptionColumn || !amountColumn
              }
            >
              {loading ? "Importing..." : "Import & Match"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "done" && importResult) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Import Complete</h3>
            <p className="text-sm text-muted-foreground">
              {importResult.rowCount} transactions imported
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3">
              <p className="text-2xl font-bold text-green-600">
                {importResult.autoMatched || 0}
              </p>
              <p className="text-xs text-muted-foreground">Auto-matched</p>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3">
              <p className="text-2xl font-bold text-yellow-600">
                {importResult.suggested || 0}
              </p>
              <p className="text-xs text-muted-foreground">Need review</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
              <p className="text-2xl font-bold text-blue-600">
                {importResult.unmatchedCsv || 0}
              </p>
              <p className="text-xs text-muted-foreground">New expenses</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Import Another
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push(`/import/${importResult.batchId}`)}
            >
              Review Matches
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
