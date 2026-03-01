const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || "llama3.2-vision";

export interface ReceiptData {
  amount: number | null;
  description: string | null;
  date: string | null;
  suggestedCategory: string | null;
}

export async function scanReceipt(imageBase64: string): Promise<ReceiptData> {
  const prompt = `Analyze this receipt image and extract the following information as a JSON object:
- "amount": the total amount paid (number, e.g., 42.50)
- "description": a short description of the merchant/store name (string)
- "date": the date on the receipt in YYYY-MM-DD format if visible (string or null)
- "suggestedCategory": one of: Groceries, Dining Out, Transportation, Utilities, Rent / Mortgage, Entertainment, Health, Shopping, Subscriptions, Insurance, Travel, Personal Care, Gifts, Education, Other

Respond with ONLY a valid JSON object, no other text.`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_VISION_MODEL,
        prompt,
        images: [imageBase64],
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      console.error("Ollama receipt scan error:", response.statusText);
      return { amount: null, description: null, date: null, suggestedCategory: null };
    }

    const data = await response.json();
    const parsed = JSON.parse(data.response);

    return {
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      description: typeof parsed.description === "string" ? parsed.description : null,
      date: typeof parsed.date === "string" ? parsed.date : null,
      suggestedCategory: typeof parsed.suggestedCategory === "string" ? parsed.suggestedCategory : null,
    };
  } catch (error) {
    console.error("Ollama receipt scan failed:", error);
    return { amount: null, description: null, date: null, suggestedCategory: null };
  }
}
