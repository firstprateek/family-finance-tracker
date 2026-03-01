import type { Category } from "@/lib/types";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

interface CategorizeResult {
  description: string;
  suggestedCategory: string;
  confidence: number;
}

export async function categorizeCsvRows(
  rows: { description: string; amount: number }[],
  existingCategories: Category[]
): Promise<CategorizeResult[]> {
  const categoryNames = existingCategories.map((c) => c.name);

  const prompt = `You are a personal finance assistant. Categorize each expense into one of these categories: ${categoryNames.join(", ")}.

For each expense, respond with a JSON array of objects with "description", "suggestedCategory", and "confidence" (0-1).

Expenses to categorize:
${rows.map((r, i) => `${i + 1}. "${r.description}" - $${r.amount}`).join("\n")}

Respond with ONLY a valid JSON array, no other text.`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      console.error("Ollama categorize error:", response.statusText);
      return rows.map((r) => ({
        description: r.description,
        suggestedCategory: "Other",
        confidence: 0,
      }));
    }

    const data = await response.json();
    const parsed = JSON.parse(data.response);

    // Handle both array and object-with-array responses
    const results = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.categories)
        ? parsed.categories
        : Array.isArray(parsed.results)
          ? parsed.results
          : [];

    return rows.map((row, i) => {
      const match = results[i];
      if (match && categoryNames.includes(match.suggestedCategory)) {
        return {
          description: row.description,
          suggestedCategory: match.suggestedCategory,
          confidence: match.confidence || 0.5,
        };
      }
      return {
        description: row.description,
        suggestedCategory: "Other",
        confidence: 0,
      };
    });
  } catch (error) {
    console.error("Ollama categorize failed:", error);
    return rows.map((r) => ({
      description: r.description,
      suggestedCategory: "Other",
      confidence: 0,
    }));
  }
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
