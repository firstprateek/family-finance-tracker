import { NextResponse } from "next/server";
import { isOllamaAvailable } from "@/lib/ai/categorize";

export async function GET() {
  const ollamaAvailable = await isOllamaAvailable();

  return NextResponse.json({
    ollama: ollamaAvailable,
    // Whisper check is expensive, we'll trust the config
    whisper: !!process.env.WHISPER_PATH,
  });
}
