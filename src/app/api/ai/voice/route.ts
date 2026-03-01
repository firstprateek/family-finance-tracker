import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { transcribeAudio } from "@/lib/ai/voice-transcribe";
import { parseExpenseFromText } from "@/lib/ai/parse-expense";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await audio.arrayBuffer());

  // Step 1: Transcribe audio with Whisper
  let transcription: string;
  try {
    transcription = await transcribeAudio(buffer);
  } catch {
    return NextResponse.json(
      { error: "Transcription failed. Is whisper-cpp installed?" },
      { status: 500 }
    );
  }

  if (!transcription.trim()) {
    return NextResponse.json(
      { error: "Could not understand audio" },
      { status: 400 }
    );
  }

  // Step 2: Parse expense from text with Ollama
  const parsed = await parseExpenseFromText(transcription);

  return NextResponse.json({
    transcription,
    ...parsed,
  });
}
