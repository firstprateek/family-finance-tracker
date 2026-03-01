const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export interface ParsedExpense {
  amount: number | null;
  description: string | null;
  suggestedCategory: string | null;
}

export async function parseExpenseFromText(text: string): Promise<ParsedExpense> {
  const prompt = `Parse this spoken expense description and extract:
- "amount": the dollar amount as a number (convert words like "twelve fifty" to 12.50)
- "description": a clean description of what was purchased
- "suggestedCategory": one of: Groceries, Dining Out, Transportation, Utilities, Rent / Mortgage, Entertainment, Health, Shopping, Subscriptions, Insurance, Travel, Personal Care, Gifts, Education, Other

Input: "${text}"

Respond with ONLY a valid JSON object, no other text.`;

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
      return { amount: null, description: text, suggestedCategory: null };
    }

    const data = await response.json();
    const parsed = JSON.parse(data.response);

    return {
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      description: typeof parsed.description === "string" ? parsed.description : text,
      suggestedCategory: typeof parsed.suggestedCategory === "string" ? parsed.suggestedCategory : null,
    };
  } catch {
    return { amount: null, description: text, suggestedCategory: null };
  }
}
