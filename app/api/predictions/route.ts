import { NextResponse } from "next/server";
import { computePredictions } from "@/lib/analysis/predictions";

export async function GET() {
  try {
    const wallets = await computePredictions();
    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("[/api/predictions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
