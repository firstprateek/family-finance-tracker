import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { scanReceipt } from "@/lib/ai/receipt-scan";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const result = await scanReceipt(base64);
  return NextResponse.json(result);
}
